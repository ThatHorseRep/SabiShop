export type SyncState =
  | 'LOCAL_ONLY'
  | 'PENDING_SYNC'
  | 'SYNCHRONIZED'
  | 'REJECTED'
  | 'FAILED'
  | 'CONFLICT'
  | 'SUPERSEDED'

export type ServerAcceptanceState =
  'unknown' | 'accepted' | 'rejected' | 'conflict'

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue }

export type ConflictRecord = {
  code: string
  message: string
  conflictingOperationIds: string[]
  requiresHumanReview: true
  escalatedTo: 'management_review'
  resolution?: {
    resolvedByUserId: string
    resolvedAt: string
    reason: string
    replacementOperationId: string
  }
}

export type SyncOperation<T = JsonValue> = {
  operationId: string
  businessId: string
  deviceId: string
  actorUserId: string
  type: string
  payload: T
  dependencies: string[]
  createdAt: string
  localRecordedAt: string
  localState: 'durable'
  businessState: string
  paymentState: string
  authorizationState: string
  serverAcceptance: ServerAcceptanceState
  syncState: SyncState
  supersedes?: string
  conflict?: ConflictRecord
  error?: {
    code: string
    message: string
    attempts: number
    retryCount: number
  }
  serverResult?: JsonValue
  serverSequence?: number
}

export type SyncOperationInput<T = JsonValue> = {
  operationId: string
  businessId: string
  deviceId: string
  actorUserId: string
  type: string
  payload: T
  dependencies?: readonly string[]
  createdAt: string
  businessState: string
  paymentState: string
  authorizationState: string
  supersedes?: string
}

export type ServerAcceptance =
  | { kind: 'accepted'; result: JsonValue; serverSequence: number }
  | { kind: 'rejected'; code: string; message: string }
  | {
      kind: 'conflict'
      code: string
      message: string
      conflictingOperationIds: string[]
    }

export interface DurableStore {
  load(): SyncOperation[]
  save(operation: SyncOperation): void
}

export class SyncStorageError extends Error {
  constructor(
    message: string,
    readonly code:
      'corrupt_local_state' | 'not_serializable' | 'storage_unavailable',
  ) {
    super(message)
    this.name = 'SyncStorageError'
  }
}

export class SyncIntegrityError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'invalid_operation'
      | 'operation_identity_reused'
      | 'cross_business_dependency'
      | 'invalid_conflict_resolution'
      | 'operation_not_found',
  ) {
    super(message)
    this.name = 'SyncIntegrityError'
  }
}

const SYNC_STATES: readonly SyncState[] = [
  'LOCAL_ONLY',
  'PENDING_SYNC',
  'SYNCHRONIZED',
  'REJECTED',
  'FAILED',
  'CONFLICT',
  'SUPERSEDED',
]

const SERVER_ACCEPTANCE_STATES: readonly ServerAcceptanceState[] = [
  'unknown',
  'accepted',
  'rejected',
  'conflict',
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null)

const isJsonSafe = (value: unknown): value is JsonValue => {
  if (value === null) return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'boolean' || typeof value === 'string') return true
  if (Array.isArray(value)) return value.every(isJsonSafe)
  if (isRecord(value))
    return Object.values(value).every(
      (nested) => nested !== undefined && isJsonSafe(nested),
    )
  return false
}

const canonicalJson = (value: JsonValue): string => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (isRecord(value)) {
    const members = Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${canonicalJson(nested)}`)
    return `{${members.join(',')}}`
  }
  return JSON.stringify(value)
}

const assertNonEmpty = (value: string, field: string): void => {
  const normalized = value.trim()
  if (!normalized || normalized.length > 256)
    throw new SyncIntegrityError(`${field} is required`, 'invalid_operation')
}

const assertOperationShape = (value: unknown): SyncOperation => {
  if (!isRecord(value))
    throw new SyncIntegrityError('operation is invalid', 'invalid_operation')
  const requiredStrings = [
    'operationId',
    'businessId',
    'deviceId',
    'actorUserId',
    'type',
    'createdAt',
    'localRecordedAt',
    'businessState',
    'paymentState',
    'authorizationState',
  ] as const
  for (const field of requiredStrings) {
    if (typeof value[field] !== 'string' || !(value[field] as string).trim())
      throw new SyncIntegrityError(`${field} is required`, 'invalid_operation')
  }
  if (
    !Array.isArray(value.dependencies) ||
    value.dependencies.some((id) => typeof id !== 'string')
  )
    throw new SyncIntegrityError(
      'dependencies are invalid',
      'invalid_operation',
    )
  if (!isJsonSafe(value.payload))
    throw new SyncIntegrityError(
      'payload is not JSON-safe',
      'invalid_operation',
    )
  if (
    !SYNC_STATES.includes(value.syncState as SyncState) ||
    !SERVER_ACCEPTANCE_STATES.includes(
      value.serverAcceptance as ServerAcceptanceState,
    ) ||
    value.localState !== 'durable'
  )
    throw new SyncIntegrityError(
      'operation state is invalid',
      'invalid_operation',
    )
  return value as SyncOperation
}

const operationFingerprint = (
  operation: SyncOperation | SyncOperationInput,
): string => {
  if (!isJsonSafe(operation.payload))
    throw new SyncIntegrityError(
      'payload is not JSON-safe',
      'invalid_operation',
    )
  return canonicalJson({
    operationId: operation.operationId,
    businessId: operation.businessId,
    deviceId: operation.deviceId,
    actorUserId: operation.actorUserId,
    type: operation.type,
    payload: operation.payload,
    dependencies: [...(operation.dependencies ?? [])].sort(),
    createdAt: operation.createdAt,
    businessState: operation.businessState,
    paymentState: operation.paymentState,
    authorizationState: operation.authorizationState,
    supersedes: operation.supersedes ?? null,
  })
}

export class MemoryStorage implements DurableStore {
  private readonly values = new Map<string, SyncOperation>()
  load(): SyncOperation[] {
    return [...this.values.values()].map((value) => structuredClone(value))
  }
  save(operation: SyncOperation): void {
    assertOperationShape(operation)
    this.values.set(operation.operationId, structuredClone(operation))
  }
}

export class LocalStorageStore implements DurableStore {
  constructor(
    private readonly storage: Storage,
    private readonly key = 'sabi-shop.sync.operations',
  ) {}

  load(): SyncOperation[] {
    const mainRaw = this.storage.getItem(this.key)
    const writeAheadRaw = this.storage.getItem(`${this.key}.wal`)
    if (mainRaw === null && writeAheadRaw === null) return []

    let mainOperations: SyncOperation[] | null = null
    let mainError: unknown
    if (mainRaw !== null) {
      try {
        mainOperations = this.parse(mainRaw, 'main')
      } catch (error) {
        if (
          !(error instanceof SyncStorageError) ||
          error.code !== 'corrupt_local_state'
        )
          throw error
        mainError = error
      }
    }

    const writeAheadOperations =
      writeAheadRaw === null ? null : this.parse(writeAheadRaw, 'wal')

    if (writeAheadOperations !== null) {
      this.storage.setItem(this.key, writeAheadRaw!)
      this.storage.removeItem(`${this.key}.wal`)
      return writeAheadOperations
    }
    if (mainOperations !== null) return mainOperations
    if (mainError !== undefined) throw mainError
    throw new SyncStorageError(
      'Corrupt local synchronization state was preserved.',
      'corrupt_local_state',
    )
  }

  save(operation: SyncOperation): void {
    assertOperationShape(operation)
    const current = this.load()
    const next = [
      ...current.filter((item) => item.operationId !== operation.operationId),
      structuredClone(operation),
    ]
    let serialized: string
    try {
      serialized = JSON.stringify(next)
    } catch {
      throw new SyncStorageError(
        'Operation is not serializable.',
        'not_serializable',
      )
    }
    try {
      this.storage.setItem(`${this.key}.wal`, serialized)
      this.storage.setItem(this.key, serialized)
      this.storage.removeItem(`${this.key}.wal`)
    } catch (error) {
      throw new SyncStorageError(
        error instanceof Error
          ? error.message
          : 'Local storage is unavailable.',
        'storage_unavailable',
      )
    }
  }

  private parse(raw: string | null, source: 'main' | 'wal'): SyncOperation[] {
    if (raw === null) return []
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      this.preserveCorrupt(raw, source)
    }
    if (!Array.isArray(parsed)) this.preserveCorrupt(raw, source)
    try {
      return parsed
        .map(assertOperationShape)
        .map((operation) => structuredClone(operation))
    } catch {
      this.preserveCorrupt(raw, source)
    }
  }

  private preserveCorrupt(raw: string, source: 'main' | 'wal'): never {
    this.storage.setItem(
      `${this.key}.corrupt`,
      JSON.stringify({ source, raw, preservedAt: new Date().toISOString() }),
    )
    throw new SyncStorageError(
      `Corrupt local synchronization state was preserved from ${source}.`,
      'corrupt_local_state',
    )
  }
}

export const newOperationId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`
}

export interface SyncServer {
  accept(operation: SyncOperation): Promise<ServerAcceptance>
}

type StoredRequest = {
  fingerprint: string
  response?: Extract<ServerAcceptance, { kind: 'accepted' | 'rejected' }>
  processing?: Promise<ServerAcceptance>
}

/** Reference server: idempotency, authority, and causal checks are explicit. */
export class InMemorySyncServer implements SyncServer {
  private readonly requests = new Map<string, StoredRequest>()
  private readonly accepted = new Map<
    string,
    { businessId: string; sequence: number }
  >()
  private sequence = 0

  constructor(
    private readonly options: {
      authorize?: (operation: SyncOperation) => boolean | Promise<boolean>
      apply?: (operation: SyncOperation) => JsonValue | Promise<JsonValue>
    } = {},
  ) {}

  async accept(operation: SyncOperation): Promise<ServerAcceptance> {
    assertOperationShape(operation)
    const fingerprint = operationFingerprint(operation)
    const prior = this.requests.get(operation.operationId)
    if (prior && prior.fingerprint !== fingerprint) {
      return {
        kind: 'conflict',
        code: 'operation_identity_reused',
        message:
          'A globally unique operation identity was reused with different content.',
        conflictingOperationIds: [operation.operationId],
      }
    }
    if (prior?.response) return structuredClone(prior.response)

    if (prior?.processing) return structuredClone(await prior.processing)

    const stored: StoredRequest = prior ?? { fingerprint }
    this.requests.set(operation.operationId, stored)
    const processing = this.process(operation, stored)
    stored.processing = processing
    try {
      return await processing
    } finally {
      stored.processing = undefined
    }
  }

  private async process(
    operation: SyncOperation,
    stored: StoredRequest,
  ): Promise<ServerAcceptance> {
    const authorized = this.options.authorize
      ? await this.options.authorize(operation)
      : true
    if (!authorized) {
      stored.response = {
        kind: 'rejected',
        code: 'authorization_denied',
        message: 'Authority must be revalidated by the server.',
      }
      return structuredClone(stored.response)
    }

    for (const dependency of operation.dependencies) {
      const acceptedDependency = this.accepted.get(dependency)
      if (!acceptedDependency) {
        return {
          kind: 'conflict',
          code: 'causal_dependency_missing',
          message: 'A causal dependency has not been accepted.',
          conflictingOperationIds: [dependency],
        }
      }
      if (acceptedDependency.businessId !== operation.businessId) {
        return {
          kind: 'conflict',
          code: 'cross_business_dependency',
          message: 'A causal dependency belongs to another business.',
          conflictingOperationIds: [dependency],
        }
      }
    }

    const applied = this.options.apply
      ? await this.options.apply(operation)
      : undefined
    const response = {
      kind: 'accepted' as const,
      result:
        applied === undefined
          ? ({
              operationId: operation.operationId,
              type: operation.type,
            } as JsonValue)
          : applied,
      serverSequence: ++this.sequence,
    }
    stored.response = response
    this.accepted.set(operation.operationId, {
      businessId: operation.businessId,
      sequence: response.serverSequence,
    })
    return structuredClone(response)
  }
}

const managementConflict = (
  code: string,
  message: string,
  conflictingOperationIds: string[],
): ConflictRecord => ({
  code,
  message,
  conflictingOperationIds: [...new Set(conflictingOperationIds)],
  requiresHumanReview: true,
  escalatedTo: 'management_review',
})

export class SyncCoordinator {
  private readonly operations = new Map<string, SyncOperation>()

  constructor(
    private readonly store: DurableStore = new MemoryStorage(),
    private readonly options: { maxAttempts?: number } = {},
  ) {
    for (const operation of store.load()) {
      assertOperationShape(operation)
      if (this.operations.has(operation.operationId))
        throw new SyncStorageError(
          'Duplicate operation identity in local store.',
          'corrupt_local_state',
        )
      this.operations.set(operation.operationId, operation)
    }
  }

  enqueue<T extends JsonValue>(input: SyncOperationInput<T>): SyncOperation<T> {
    for (const field of [
      'operationId',
      'businessId',
      'deviceId',
      'actorUserId',
      'type',
      'createdAt',
      'businessState',
      'paymentState',
      'authorizationState',
    ] as const)
      assertNonEmpty(input[field], field)
    if (!isJsonSafe(input.payload))
      throw new SyncIntegrityError(
        'payload is not JSON-safe',
        'invalid_operation',
      )
    if (Number.isNaN(Date.parse(input.createdAt)))
      throw new SyncIntegrityError(
        'createdAt must be an ISO timestamp',
        'invalid_operation',
      )

    const dependencies = [...new Set(input.dependencies ?? [])]
    if (dependencies.includes(input.operationId))
      throw new SyncIntegrityError(
        'an operation cannot depend on itself',
        'invalid_operation',
      )

    for (const dependency of dependencies) {
      const existing = this.operations.get(dependency)
      if (existing && existing.businessId !== input.businessId)
        throw new SyncIntegrityError(
          'dependency belongs to another business',
          'cross_business_dependency',
        )
    }

    if (input.supersedes) {
      const original = this.operations.get(input.supersedes)
      if (!original)
        throw new SyncIntegrityError(
          'superseded operation not found',
          'operation_not_found',
        )
      if (original.businessId !== input.businessId)
        throw new SyncIntegrityError(
          'superseded operation belongs to another business',
          'cross_business_dependency',
        )
      if (
        original.syncState !== 'CONFLICT' &&
        original.syncState !== 'REJECTED'
      )
        throw new SyncIntegrityError(
          'only a conflicted or rejected operation may be superseded',
          'invalid_conflict_resolution',
        )
    }

    const existing = this.operations.get(input.operationId)
    if (existing) {
      if (operationFingerprint(existing) === operationFingerprint(input))
        return structuredClone(existing) as SyncOperation<T>
      throw new SyncIntegrityError(
        'operation identity was reused with different content',
        'operation_identity_reused',
      )
    }

    const operation: SyncOperation<T> = {
      ...input,
      dependencies,
      payload: structuredClone(input.payload),
      localRecordedAt: new Date().toISOString(),
      localState: 'durable',
      serverAcceptance: 'unknown',
      syncState: 'LOCAL_ONLY',
    }
    this.persist(operation)
    return structuredClone(operation)
  }

  get(businessId: string, operationId: string): SyncOperation | undefined {
    const operation = this.operations.get(operationId)
    return operation?.businessId === businessId
      ? structuredClone(operation)
      : undefined
  }

  list(
    businessId: string,
    filter: { syncState?: SyncState } = {},
  ): SyncOperation[] {
    return [...this.operations.values()]
      .filter(
        (item) =>
          item.businessId === businessId &&
          (!filter.syncState || item.syncState === filter.syncState),
      )
      .map((item) => structuredClone(item))
  }

  listConflicts(businessId: string): SyncOperation[] {
    return this.list(businessId, { syncState: 'CONFLICT' })
  }

  async sync(server: SyncServer, businessId: string): Promise<SyncOperation[]> {
    this.markCausalCycles(businessId)
    const maxAttempts = Math.max(1, this.options.maxAttempts ?? 5)
    for (const operation of [...this.operations.values()]) {
      if (operation.businessId !== businessId) continue
      if (
        !['LOCAL_ONLY', 'PENDING_SYNC', 'FAILED'].includes(operation.syncState)
      )
        continue
      if (
        operation.syncState === 'FAILED' &&
        (operation.error?.attempts ?? 0) >= maxAttempts
      )
        continue

      const terminalDependency = operation.dependencies
        .map((dependency) => this.operations.get(dependency))
        .find(
          (dependency) =>
            dependency !== undefined &&
            ['REJECTED', 'CONFLICT', 'SUPERSEDED'].includes(
              dependency.syncState,
            ),
        )
      if (terminalDependency) {
        operation.syncState = 'CONFLICT'
        operation.conflict = managementConflict(
          'causal_dependency_not_accepted',
          'A causal dependency cannot be accepted.',
          [terminalDependency.operationId],
        )
        this.persist(operation)
        continue
      }

      const blocked = operation.dependencies.some((dependency) => {
        const dependencyState = this.operations.get(dependency)?.syncState
        return (
          dependencyState !== undefined && dependencyState !== 'SYNCHRONIZED'
        )
      })
      if (blocked) continue

      operation.syncState = 'PENDING_SYNC'
      this.persist(operation)
      try {
        const response = await server.accept(structuredClone(operation))
        if (response.kind === 'accepted') {
          operation.syncState = 'SYNCHRONIZED'
          operation.serverAcceptance = 'accepted'
          operation.serverResult = response.result
          operation.serverSequence = response.serverSequence
          operation.error = undefined
          operation.conflict = undefined
        } else if (response.kind === 'rejected') {
          operation.syncState = 'REJECTED'
          operation.serverAcceptance = 'rejected'
          operation.error = {
            code: response.code,
            message: response.message,
            attempts: (operation.error?.attempts ?? 0) + 1,
            retryCount: operation.error?.retryCount ?? 0,
          }
          if (response.code === 'authorization_denied') {
            operation.syncState = 'CONFLICT'
            operation.conflict = managementConflict(
              'authorization_denied_offline',
              'The server denied authority for this offline operation. Management review is required before it is superseded or discarded.',
              [operation.operationId],
            )
          }
        } else {
          operation.syncState = 'CONFLICT'
          operation.serverAcceptance = 'conflict'
          operation.conflict = managementConflict(
            response.code,
            response.message,
            response.conflictingOperationIds,
          )
        }
      } catch (error) {
        operation.syncState = 'FAILED'
        operation.serverAcceptance = 'unknown'
        operation.error = {
          code: 'transport_error',
          message:
            error instanceof Error ? error.message : 'Synchronization failed.',
          attempts: (operation.error?.attempts ?? 0) + 1,
          retryCount: operation.error?.retryCount ?? 0,
        }
      }
      this.persist(operation)
    }
    return this.list(businessId)
  }

  retry(businessId: string, operationId: string): SyncOperation {
    const operation = this.requireOperation(businessId, operationId)
    const retryableMissingDependency =
      operation.syncState === 'CONFLICT' &&
      operation.conflict?.code === 'causal_dependency_missing'
    if (operation.syncState !== 'FAILED' && !retryableMissingDependency)
      throw new SyncIntegrityError(
        'only failed or missing-dependency operations may be retried',
        'invalid_operation',
      )
    operation.syncState = 'PENDING_SYNC'
    operation.error = {
      code: operation.error?.code ?? 'transport_error',
      message: operation.error?.message ?? 'Synchronization failed.',
      attempts: 0,
      retryCount: (operation.error?.retryCount ?? 0) + 1,
    }
    this.persist(operation)
    return structuredClone(operation)
  }

  markConflict(
    businessId: string,
    operationId: string,
    code: string,
    message: string,
    conflictingOperationIds: string[],
  ): SyncOperation {
    const operation = this.requireOperation(businessId, operationId)
    operation.syncState = 'CONFLICT'
    operation.serverAcceptance = 'conflict'
    operation.conflict = managementConflict(
      code,
      message,
      conflictingOperationIds,
    )
    this.persist(operation)
    return structuredClone(operation)
  }

  resolveConflict(
    businessId: string,
    operationId: string,
    resolution: {
      resolvedByUserId: string
      reason: string
      replacementOperationId: string
    },
  ): SyncOperation {
    const original = this.requireOperation(businessId, operationId)
    if (original.syncState !== 'CONFLICT' || !original.conflict)
      throw new SyncIntegrityError(
        'only a conflicted operation may be resolved',
        'invalid_conflict_resolution',
      )
    const replacement = this.requireOperation(
      businessId,
      resolution.replacementOperationId,
    )
    if (replacement.supersedes !== original.operationId)
      throw new SyncIntegrityError(
        'replacement does not supersede the conflicted operation',
        'invalid_conflict_resolution',
      )
    if (
      !resolution.resolvedByUserId.trim() ||
      !resolution.reason.trim() ||
      resolution.resolvedByUserId === original.actorUserId ||
      resolution.resolvedByUserId === replacement.actorUserId
    )
      throw new SyncIntegrityError(
        'conflict resolution requires a separate reviewer and reason',
        'invalid_conflict_resolution',
      )

    original.syncState = 'SUPERSEDED'
    original.conflict = {
      ...original.conflict,
      resolution: {
        resolvedByUserId: resolution.resolvedByUserId,
        resolvedAt: new Date().toISOString(),
        reason: resolution.reason,
        replacementOperationId: replacement.operationId,
      },
    }
    this.persist(original)
    return structuredClone(original)
  }

  private requireOperation(
    businessId: string,
    operationId: string,
  ): SyncOperation {
    const operation = this.operations.get(operationId)
    if (!operation || operation.businessId !== businessId)
      throw new SyncIntegrityError('operation not found', 'operation_not_found')
    return operation
  }

  private markCausalCycles(businessId: string): void {
    const pending = [...this.operations.values()].filter(
      (operation) =>
        operation.businessId === businessId &&
        ['LOCAL_ONLY', 'PENDING_SYNC', 'FAILED'].includes(operation.syncState),
    )
    const visiting = new Set<string>()
    const visited = new Set<string>()
    const cyclic = new Set<string>()

    const visit = (operationId: string): void => {
      if (visited.has(operationId)) return
      if (visiting.has(operationId)) {
        for (const id of visiting) cyclic.add(id)
        cyclic.add(operationId)
        return
      }
      visiting.add(operationId)
      const operation = this.operations.get(operationId)
      for (const dependency of operation?.dependencies ?? []) visit(dependency)
      visiting.delete(operationId)
      visited.add(operationId)
    }

    for (const operation of pending) visit(operation.operationId)
    for (const operationId of cyclic) {
      const operation = this.operations.get(operationId)
      if (!operation || operation.businessId !== businessId) continue
      operation.syncState = 'CONFLICT'
      operation.conflict = managementConflict(
        'causal_cycle',
        'Causal dependencies form a cycle.',
        [...cyclic],
      )
      this.persist(operation)
    }
  }

  private persist(operation: SyncOperation): void {
    this.operations.set(operation.operationId, operation)
    this.store.save(operation)
  }
}
