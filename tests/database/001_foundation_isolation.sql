-- Run this file with psql against a disposable database after applying
-- migrations/001_foundation.sql as a non-owner role with access to app.*.
BEGIN;

SELECT plan(11);

SET LOCAL app.user_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO app.users (id, auth_subject, display_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'test-user-a', 'User A');

SET LOCAL app.user_id = '00000000-0000-0000-0000-000000000002';

INSERT INTO app.users (id, auth_subject, display_name)
VALUES ('00000000-0000-0000-0000-000000000002', 'test-user-b', 'User B');

SET LOCAL app.user_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO app.businesses (id, name, created_by_user_id)
VALUES ('10000000-0000-0000-0000-000000000001', 'Business A',
        '00000000-0000-0000-0000-000000000001');

INSERT INTO app.business_memberships (business_id, user_id, role)
VALUES ('10000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001', 'owner');

SELECT is(
    (SELECT count(*)::integer FROM app.businesses),
    1,
    'a member can read their business'
);

SELECT is(
    (SELECT count(*)::integer
     FROM app.business_memberships
     WHERE business_id = '10000000-0000-0000-0000-000000000001'),
    1,
    'a member can read their membership'
);

SET LOCAL app.user_id = '00000000-0000-0000-0000-000000000002';

SELECT is(
    (SELECT count(*)::integer FROM app.businesses),
    0,
    'a non-member cannot read another business'
);

SELECT is(
    (SELECT count(*)::integer
     FROM app.business_memberships
     WHERE business_id = '10000000-0000-0000-0000-000000000001'),
    0,
    'a non-member cannot infer another membership'
);

SELECT is(
    (SELECT count(*)::integer
     FROM app.devices
     WHERE business_id = '10000000-0000-0000-0000-000000000001'),
    0,
    'a non-member cannot read another business device'
);

SELECT throws_ok(
    $$INSERT INTO app.business_memberships (business_id, user_id, role)
      VALUES
      ('10000000-0000-0000-0000-000000000001',
       '00000000-0000-0000-0000-000000000002', 'staff')$$,
    NULL,
    NULL,
    'a user cannot self-join another business'
);

SELECT throws_ok(
    $$INSERT INTO app.devices
      (business_id, membership_id, device_key_hash, label)
      VALUES
      ('10000000-0000-0000-0000-000000000001',
       '20000000-0000-0000-0000-000000000001', 'hash-b', 'Device B')$$,
    NULL,
    NULL,
    'a non-member cannot create a device in another business'
);

SELECT throws_ok(
    $$UPDATE app.businesses
      SET name = 'tampered'
      WHERE id = '10000000-0000-0000-0000-000000000001'$$,
    NULL,
    NULL,
    'a non-member cannot update another business'
);

SET LOCAL app.user_id = '00000000-0000-0000-0000-000000000001';

SELECT lives_ok(
    $$INSERT INTO app.audit_events
      (business_id, event_type, target_type, operation_id)
      VALUES
      ('10000000-0000-0000-0000-000000000001', 'test', 'test_target', 'operation-1')$$,
    'a member can append audit evidence'
);

SELECT throws_ok(
    $$DELETE FROM app.audit_events
      WHERE business_id = '10000000-0000-0000-0000-000000000001'$$,
    NULL,
    NULL,
    'audit evidence is not deletable'
);

SELECT throws_ok(
    $$INSERT INTO app.audit_events
      (business_id, event_type, target_type, operation_id, result)
      VALUES
      ('10000000-0000-0000-0000-000000000001', 'sale.completed', 'sale', 'operation-1', 'accepted')$$,
    '23505',
    NULL,
    'duplicate operation identity is rejected within a business'
);

SELECT throws_ok(
    $$INSERT INTO app.devices
      (business_id, membership_id, device_key_hash, label)
      VALUES
      ('10000000-0000-0000-0000-000000000001',
       '20000000-0000-0000-0000-000000000001', 'hash-cross', 'Cross tenant')$$,
    '23503',
    NULL,
    'a device cannot reference a membership from another business'
);

SELECT * FROM finish();
ROLLBACK;
