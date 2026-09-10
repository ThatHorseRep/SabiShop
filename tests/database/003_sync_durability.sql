-- Run this file with psql against a disposable database after applying
-- migrations/001_foundation.sql, 002_catalog_pricing.sql, and
-- 003_sync_durability.sql as a non-owner role with access to app.*.
BEGIN;

SELECT plan(8);

SET LOCAL app.user_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO app.users (id, auth_subject, display_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'sync-user', 'Sync User');

INSERT INTO app.businesses (id, name, created_by_user_id)
VALUES ('30000000-0000-0000-0000-000000000001', 'Sync Business',
        '00000000-0000-0000-0000-000000000001');

INSERT INTO app.business_memberships (
    id, business_id, user_id, role
)
VALUES (
    '31000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'owner'
);

INSERT INTO app.devices (
    id, business_id, membership_id, device_key_hash, label
)
VALUES (
    '32000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '31000000-0000-0000-0000-000000000001',
    'sync-device-hash',
    'Sync Test Device'
);

INSERT INTO app.sync_operations (
    id,
    business_id,
    device_id,
    membership_id,
    operation_id,
    operation_type,
    operation_fingerprint,
    payload,
    dependencies,
    client_created_at
)
VALUES (
    '33000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '32000000-0000-0000-0000-000000000001',
    '31000000-0000-0000-0000-000000000001',
    '34000000-0000-0000-0000-000000000001',
    'sale.complete',
    'fingerprint-sale-1',
    '{"saleId":"sale-1"}'::jsonb,
    '[]'::jsonb,
    '2026-09-10T09:00:00Z'::timestamptz
);

SELECT throws_ok(
    $$INSERT INTO app.sync_operations (
        business_id, device_id, membership_id, operation_id, operation_type,
        operation_fingerprint, payload, dependencies, client_created_at
    )
    VALUES (
        '30000000-0000-0000-0000-000000000001',
        '32000000-0000-0000-0000-000000000001',
        '31000000-0000-0000-0000-000000000001',
        '34000000-0000-0000-0000-000000000001',
        'sale.complete',
        'fingerprint-sale-1',
        '{"saleId":"sale-1"}'::jsonb,
        '[]'::jsonb,
        '2026-09-10T09:00:00Z'::timestamptz
    )$$,
    '23505',
    NULL,
    'a duplicate operation identity is rejected within a business'
);

SELECT throws_ok(
    $$UPDATE app.sync_operations
      SET operation_fingerprint = 'tampered-fingerprint'
      WHERE operation_id = '34000000-0000-0000-0000-000000000001'$$,
    'P0001',
    NULL,
    'an accepted operation fingerprint cannot be changed'
);

SELECT throws_ok(
    $$UPDATE app.sync_operations
      SET payload = '{"saleId":"tampered"}'::jsonb
      WHERE operation_id = '34000000-0000-0000-0000-000000000001'$$,
    'P0001',
    NULL,
    'an accepted operation payload cannot be changed'
);

SELECT lives_ok(
    $$UPDATE app.sync_operations
      SET status = 'accepted',
          server_response = '{"kind":"accepted","serverSequence":1}'::jsonb,
          server_sequence = 1,
          completed_at = now()
      WHERE operation_id = '34000000-0000-0000-0000-000000000001'$$,
    'the authoritative transaction can record an accepted response once'
);

SELECT throws_ok(
    $$UPDATE app.sync_operations
      SET server_response = '{"kind":"accepted","serverSequence":2}'::jsonb
      WHERE operation_id = '34000000-0000-0000-0000-000000000001'$$,
    'P0001',
    NULL,
    'a recorded server response cannot be replaced'
);

INSERT INTO app.sync_operation_effects (
    business_id, sync_operation_id, effect_type, effect_id
)
VALUES (
    '30000000-0000-0000-0000-000000000001',
    '33000000-0000-0000-0000-000000000001',
    'sale',
    'sale-1'
);

SELECT throws_ok(
    $$INSERT INTO app.sync_operation_effects (
        business_id, sync_operation_id, effect_type, effect_id
    )
    VALUES (
        '30000000-0000-0000-0000-000000000001',
        '33000000-0000-0000-0000-000000000001',
        'sale',
        'sale-1'
    )$$,
    '23505',
    NULL,
    'one accepted effect cannot be linked twice'
);

INSERT INTO app.sync_operations (
    id,
    business_id,
    device_id,
    membership_id,
    operation_id,
    operation_type,
    operation_fingerprint,
    payload,
    dependencies,
    client_created_at
)
VALUES (
    '38000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '32000000-0000-0000-0000-000000000001',
    '31000000-0000-0000-0000-000000000001',
    '39000000-0000-0000-0000-000000000001',
    'sale.complete',
    'fingerprint-sale-not-accepted',
    '{"saleId":"sale-not-accepted"}'::jsonb,
    '[]'::jsonb,
    '2026-09-10T09:02:00Z'::timestamptz
);

SELECT throws_ok(
    $$INSERT INTO app.sync_operation_effects (
        business_id, sync_operation_id, effect_type, effect_id
    )
    VALUES (
        '30000000-0000-0000-0000-000000000001',
        '38000000-0000-0000-0000-000000000001',
        'sale',
        'sale-not-accepted'
    )$$,
    'P0001',
    NULL,
    'an effect cannot be linked before its operation is accepted'
);

DO $test$
BEGIN
    BEGIN
        INSERT INTO app.sync_operations (
            id,
            business_id,
            device_id,
            membership_id,
            operation_id,
            operation_type,
            operation_fingerprint,
            payload,
            dependencies,
            client_created_at,
            status,
            server_response,
            server_sequence,
            completed_at
        )
        VALUES (
            '35000000-0000-0000-0000-000000000001',
            '30000000-0000-0000-0000-000000000001',
            '32000000-0000-0000-0000-000000000001',
            '31000000-0000-0000-0000-000000000001',
            '36000000-0000-0000-0000-000000000001',
            'sale.complete',
            'fingerprint-sale-2',
            '{"saleId":"sale-2"}'::jsonb,
            '[]'::jsonb,
            '2026-09-10T09:01:00Z'::timestamptz,
            'accepted',
            '{"kind":"accepted","serverSequence":2}'::jsonb,
            2,
            now()
        );

        INSERT INTO app.sync_operation_effects (
            business_id, sync_operation_id, effect_type, effect_id
        )
        VALUES (
            '30000000-0000-0000-0000-000000000001',
            '37000000-0000-0000-0000-000000000001',
            'sale',
            'sale-2'
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END
$test$;

SELECT is(
    (
        SELECT count(*)::integer
        FROM app.sync_operations
        WHERE operation_id = '36000000-0000-0000-0000-000000000001'
    ),
    0,
    'a failed effect link rolls back the incomplete operation transaction'
);

SELECT * FROM finish();
ROLLBACK;
