import { describe, expect, it } from 'vitest'
import {
  InMemorySyncServer,
  LocalStorageStore,
  MemoryStorage,
  SyncCoordinator,
  SyncIntegrityError,
  SyncStorageError,
  type JsonValue,
  type ServerAcceptance,
  type SyncOperation,
  type SyncOperationInput,
  type SyncServer,
} from './offlineSync'

const createdAt = '2026-09-06T10:00:00.000Z'

const input = (
  operationId: string,
  overrides: Partial<SyncOperationInput> = {},
): SyncOperationInput => ({
  operationId,
  businessId: 'biz-1',
  deviceId: 'device-1',
  actorUserId: 'user-1',
  type: 'sale.complete',
  payload: { value: 1 },
  dependencies: [],
  createdAt,
  businessState: 'PENDING_COMPLETION',
  paymentState: 'CONFIRMED_SUCCESS',
  authorizationState: 'NOT_REQUIRED',
  ...overrides,
})

const storageStub = () => {
  const values = new Map<string, string>()
  const storage: Storage = {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
  return { storage, values }
}

const conflictResponse = (operationId: string): ServerAcceptance => ({
  kind: 'conflict',
  code: 'material_conflict',
  message: 'A competing operation changed the same financial record.',
  conflictingOperationIds: [`server-${operationId}`],
})

describe('offline synchronization reliability', () => {
  it('durably persists stable identities and recovers after app restart', () => {
    const storage = new MemoryStorage()
    const first = new SyncCoordinator(storage)
    const operation = first.enqueue(input('operation-1'))

    const restarted = new SyncCoordinator(storage)
    const replay = restarted.enqueue(input('operation-1'))

    expect(restarted.get('biz-1', operation.operationId)?.syncState).toBe(
      'LOCAL_ONLY',
    )
    expect(replay).toEqual(operation)
    expect(restarted.list('biz-1')).toHaveLength(1)
  })

  it('retries timeout after server acceptance without a duplicate effect', async () => {
    const coordinator = new SyncCoordinator()
    const operation = coordinator.enqueue(input('operation-timeout'))
    let applications = 0
    const backing = new InMemorySyncServer({
      apply: () => {
        applications += 1
        return { accepted: true }
      },
    })
    let calls = 0
    const server: SyncServer = {
      accept: async (value) => {
        calls += 1
        if (calls === 1) {
          await backing.accept(value)
          throw new Error('timeout after server acceptance')
        }
        return backing.accept(value)
      },
    }

    await coordinator.sync(server, 'biz-1')
    expect(coordinator.get('biz-1', operation.operationId)?.syncState).toBe(
      'FAILED',
    )

    await coordinator.sync(server, 'biz-1')
    const saved = coordinator.get('biz-1', operation.operationId)
    expect(saved?.syncState).toBe('SYNCHRONIZED')
    expect(saved?.serverSequence).toBe(1)
    expect(calls).toBe(2)
    expect(applications).toBe(1)
  })

  it('returns the same accepted result for duplicate delivery', async () => {
    const server = new InMemorySyncServer()
    const coordinator = new SyncCoordinator()
    const operation = coordinator.enqueue(input('operation-duplicate'))

    const first = await server.accept(operation)
    const second = await server.accept(structuredClone(operation))

    expect(second).toEqual(first)
  })

  it('detects reuse of a global operation identity with different content', async () => {
    const coordinator = new SyncCoordinator()
    const operation = coordinator.enqueue(input('operation-reused'))
    expect(() =>
      coordinator.enqueue(input('operation-reused', { payload: { value: 2 } })),
    ).toThrow(SyncIntegrityError)

    const server = new InMemorySyncServer()
    await server.accept(operation)
    const tampered: SyncOperation = {
      ...operation,
      payload: { value: 2 },
    }
    const response = await server.accept(tampered)
    expect(response).toMatchObject({
      kind: 'conflict',
      code: 'operation_identity_reused',
    })
  })

  it('preserves causal order and recovers a stale client after the server learns a dependency', async () => {
    const coordinator = new SyncCoordinator()
    const parent = coordinator.enqueue(input('operation-parent'))
    const child = coordinator.enqueue(
      input('operation-child', {
        type: 'inventory.movement',
        dependencies: ['operation-parent'],
      }),
    )
    const server = new InMemorySyncServer()

    await coordinator.sync(server, 'biz-1')
    expect(coordinator.get('biz-1', parent.operationId)?.syncState).toBe(
      'SYNCHRONIZED',
    )
    expect(coordinator.get('biz-1', child.operationId)?.syncState).toBe(
      'SYNCHRONIZED',
    )

    const staleCoordinator = new SyncCoordinator()
    const staleChild = staleCoordinator.enqueue(
      input('operation-server-parent', {
        type: 'inventory.movement',
        dependencies: ['server-only-parent'],
      }),
    )
    const staleServer = new InMemorySyncServer()
    await staleCoordinator.sync(staleServer, 'biz-1')
    expect(
      staleCoordinator.get('biz-1', staleChild.operationId)?.syncState,
    ).toBe('CONFLICT')

    await staleServer.accept(
      staleCoordinator.enqueue(
        input('server-only-parent', { type: 'sale.complete' }),
      ),
    )
    staleCoordinator.retry('biz-1', staleChild.operationId)
    await staleCoordinator.sync(staleServer, 'biz-1')
    await staleCoordinator.sync(staleServer, 'biz-1')
    expect(
      staleCoordinator.get('biz-1', staleChild.operationId)?.syncState,
    ).toBe('SYNCHRONIZED')
  })

  it('keeps business queues isolated and rejects cross-business dependencies', async () => {
    const storage = new MemoryStorage()
    const coordinator = new SyncCoordinator(storage)
    const first = coordinator.enqueue(input('operation-tenant-1'))
    const second = coordinator.enqueue(
      input('operation-tenant-2', { businessId: 'biz-2' }),
    )
    await coordinator.sync(new InMemorySyncServer(), 'biz-1')

    expect(coordinator.get('biz-1', first.operationId)?.syncState).toBe(
      'SYNCHRONIZED',
    )
    expect(coordinator.get('biz-2', second.operationId)?.syncState).toBe(
      'LOCAL_ONLY',
    )
    expect(coordinator.get('biz-2', first.operationId)).toBeUndefined()
    expect(() =>
      coordinator.enqueue(
        input('operation-cross-tenant', {
          dependencies: ['operation-tenant-2'],
        }),
      ),
    ).toThrow(SyncIntegrityError)
  })

  it('continues safe independent work after partial batch failure', async () => {
    const coordinator = new SyncCoordinator()
    const failing = coordinator.enqueue(
      input('operation-partial-failed', { type: 'payment.confirm' }),
    )
    const independent = coordinator.enqueue(
      input('operation-partial-safe', { type: 'catalog.read' }),
    )
    const server: SyncServer = {
      accept: async (operation) => {
        if (operation.operationId === failing.operationId)
          throw new Error('server unavailable')
        return new InMemorySyncServer().accept(operation)
      },
    }

    await coordinator.sync(server, 'biz-1')
    expect(coordinator.get('biz-1', failing.operationId)?.syncState).toBe(
      'FAILED',
    )
    expect(coordinator.get('biz-1', independent.operationId)?.syncState).toBe(
      'SYNCHRONIZED',
    )
  })

  it('rechecks authorization at the server and records rejection', async () => {
    const coordinator = new SyncCoordinator()
    const operation = coordinator.enqueue(input('operation-denied'))
    await coordinator.sync(
      new InMemorySyncServer({ authorize: () => false }),
      'biz-1',
    )

    const saved = coordinator.get('biz-1', operation.operationId)
    expect(saved?.syncState).toBe('REJECTED')
    expect(saved?.serverAcceptance).toBe('rejected')
    expect(saved?.error?.code).toBe('authorization_denied')
  })

  it('bounds automatic retries and makes operator retry observable', async () => {
    const coordinator = new SyncCoordinator(new MemoryStorage(), {
      maxAttempts: 1,
    })
    const operation = coordinator.enqueue(input('operation-bounded'))
    const server: SyncServer = {
      accept: async () => {
        throw new Error('network unavailable')
      },
    }

    await coordinator.sync(server, 'biz-1')
    await coordinator.sync(server, 'biz-1')
    expect(
      coordinator.get('biz-1', operation.operationId)?.error?.attempts,
    ).toBe(1)

    coordinator.retry('biz-1', operation.operationId)
    await coordinator.sync(server, 'biz-1')
    const saved = coordinator.get('biz-1', operation.operationId)
    expect(saved?.error?.attempts).toBe(1)
    expect(saved?.error?.retryCount).toBe(1)
  })

  it('escalates material conflicts and requires separate human resolution', async () => {
    const coordinator = new SyncCoordinator()
    const original = coordinator.enqueue(input('operation-conflict'))
    const server: SyncServer = {
      accept: async () => conflictResponse(original.operationId),
    }
    await coordinator.sync(server, 'biz-1')
    expect(coordinator.listConflicts('biz-1')).toHaveLength(1)
    expect(
      coordinator.get('biz-1', original.operationId)?.conflict?.escalatedTo,
    ).toBe('management_review')

    const replacement = coordinator.enqueue(
      input('operation-replacement', {
        type: 'correction.apply',
        supersedes: original.operationId,
      }),
    )
    expect(() =>
      coordinator.resolveConflict('biz-1', original.operationId, {
        resolvedByUserId: original.actorUserId,
        reason: 'same person cannot review',
        replacementOperationId: replacement.operationId,
      }),
    ).toThrow(SyncIntegrityError)

    const resolved = coordinator.resolveConflict(
      'biz-1',
      original.operationId,
      {
        resolvedByUserId: 'manager-1',
        reason:
          'Kept the server-accepted stock movement and issued a correction.',
        replacementOperationId: replacement.operationId,
      },
    )
    expect(resolved.syncState).toBe('SUPERSEDED')
    expect(resolved.conflict?.resolution?.resolvedByUserId).toBe('manager-1')
    expect(coordinator.get('biz-1', replacement.operationId)?.syncState).toBe(
      'LOCAL_ONLY',
    )
  })

  it('preserves causal cycles as conflicts instead of inventing an order', async () => {
    const coordinator = new SyncCoordinator()
    const first = coordinator.enqueue(
      input('operation-cycle-a', { dependencies: ['operation-cycle-b'] }),
    )
    const second = coordinator.enqueue(
      input('operation-cycle-b', { dependencies: ['operation-cycle-a'] }),
    )
    await coordinator.sync(new InMemorySyncServer(), 'biz-1')

    expect(coordinator.get('biz-1', first.operationId)?.conflict?.code).toBe(
      'causal_cycle',
    )
    expect(coordinator.get('biz-1', second.operationId)?.conflict?.code).toBe(
      'causal_cycle',
    )
  })

  it('recovers from an interrupted localStorage write-ahead record', () => {
    const { storage } = storageStub()
    const store = new LocalStorageStore(storage, 'operations')
    const coordinator = new SyncCoordinator(store)
    const operation = coordinator.enqueue(input('operation-wal'))

    storage.setItem('operations', '[]')
    storage.setItem(
      'operations.wal',
      JSON.stringify([structuredClone(operation)]),
    )

    const recovered = new SyncCoordinator(
      new LocalStorageStore(storage, 'operations'),
    )
    expect(recovered.get('biz-1', operation.operationId)?.operationId).toBe(
      operation.operationId,
    )
    expect(storage.getItem('operations.wal')).toBeNull()
  })

  it('preserves corrupted local state instead of silently replacing it', () => {
    const { storage } = storageStub()
    storage.setItem('operations', '{not-json')
    const store = new LocalStorageStore(storage, 'operations')

    expect(() => store.load()).toThrow(SyncStorageError)
    expect(storage.getItem('operations')).toBe('{not-json')
    const preserved = JSON.parse(
      storage.getItem('operations.corrupt') ?? '{}',
    ) as { source: string; raw: string }
    expect(preserved).toMatchObject({ source: 'main', raw: '{not-json' })
  })

  it('rejects non-JSON local payloads before durability is claimed', () => {
    const coordinator = new SyncCoordinator()
    expect(() =>
      coordinator.enqueue(
        input('operation-invalid-payload', {
          payload: { invalid: undefined } as unknown as JsonValue,
        }),
      ),
    ).toThrow(SyncIntegrityError)
  })
})
