BEGIN;

ALTER TABLE app.sync_operations
    ADD COLUMN operation_fingerprint text,
    ADD COLUMN payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN dependencies jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN server_response jsonb,
    ADD COLUMN server_sequence bigint;

UPDATE app.sync_operations
SET operation_fingerprint = 'legacy:' || operation_id::text
WHERE operation_fingerprint IS NULL;

ALTER TABLE app.sync_operations
    ALTER COLUMN operation_fingerprint SET NOT NULL;

ALTER TABLE app.sync_operations
    ADD CONSTRAINT sync_operations_fingerprint_present
        CHECK (length(trim(operation_fingerprint)) > 0),
    ADD CONSTRAINT sync_operations_dependencies_array
        CHECK (jsonb_typeof(dependencies) = 'array'),
    ADD CONSTRAINT sync_operations_server_sequence_positive
        CHECK (server_sequence IS NULL OR server_sequence > 0),
    ADD CONSTRAINT sync_operations_business_row
        UNIQUE (business_id, id);

CREATE INDEX sync_operations_fingerprint_idx
    ON app.sync_operations (business_id, operation_fingerprint);

CREATE INDEX sync_operations_dependencies_idx
    ON app.sync_operations USING gin (dependencies jsonb_path_ops);

CREATE OR REPLACE FUNCTION app.prevent_sync_operation_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'sync_operations are append-only';
    END IF;

    IF OLD.business_id IS DISTINCT FROM NEW.business_id
        OR OLD.device_id IS DISTINCT FROM NEW.device_id
        OR OLD.membership_id IS DISTINCT FROM NEW.membership_id
        OR OLD.operation_id IS DISTINCT FROM NEW.operation_id
        OR OLD.operation_type IS DISTINCT FROM NEW.operation_type
        OR OLD.operation_fingerprint IS DISTINCT FROM NEW.operation_fingerprint
        OR OLD.payload IS DISTINCT FROM NEW.payload
        OR OLD.dependencies IS DISTINCT FROM NEW.dependencies
        OR OLD.client_created_at IS DISTINCT FROM NEW.client_created_at THEN
        RAISE EXCEPTION 'sync operation envelope is immutable';
    END IF;

    IF OLD.server_response IS NOT NULL
        AND NEW.server_response IS DISTINCT FROM OLD.server_response THEN
        RAISE EXCEPTION 'an accepted or rejected sync response is immutable';
    END IF;

    IF OLD.server_sequence IS NOT NULL
        AND NEW.server_sequence IS DISTINCT FROM OLD.server_sequence THEN
        RAISE EXCEPTION 'an accepted sync sequence is immutable';
    END IF;

    IF OLD.status IN ('accepted', 'rejected', 'conflicted')
        AND NEW.status IS DISTINCT FROM OLD.status THEN
        RAISE EXCEPTION 'a terminal sync status is immutable';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER sync_operations_no_mutation
    BEFORE UPDATE OR DELETE ON app.sync_operations
    FOR EACH ROW EXECUTE FUNCTION app.prevent_sync_operation_mutation();

CREATE TABLE app.sync_operation_effects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES app.businesses(id) ON DELETE RESTRICT,
    sync_operation_id uuid NOT NULL,
    effect_type text NOT NULL CHECK (length(trim(effect_type)) > 0),
    effect_id text NOT NULL CHECK (length(trim(effect_id)) > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (business_id, sync_operation_id)
        REFERENCES app.sync_operations (business_id, id)
        ON DELETE RESTRICT,
    UNIQUE (business_id, effect_type, effect_id)
);

CREATE INDEX sync_operation_effects_operation_idx
    ON app.sync_operation_effects (business_id, sync_operation_id, effect_type);

CREATE OR REPLACE FUNCTION app.require_accepted_sync_effect()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM app.sync_operations operation
        WHERE operation.business_id = NEW.business_id
          AND operation.id = NEW.sync_operation_id
          AND operation.status = 'accepted'
    ) THEN
        RAISE EXCEPTION 'sync effects can only reference accepted operations';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION app.prevent_sync_effect_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'sync_operation_effects are append-only';
END;
$$;

CREATE TRIGGER sync_operation_effects_require_accepted
    BEFORE INSERT ON app.sync_operation_effects
    FOR EACH ROW EXECUTE FUNCTION app.require_accepted_sync_effect();

CREATE TRIGGER sync_operation_effects_no_mutation
    BEFORE UPDATE OR DELETE ON app.sync_operation_effects
    FOR EACH ROW EXECUTE FUNCTION app.prevent_sync_effect_mutation();

ALTER TABLE app.sync_operation_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.sync_operation_effects FORCE ROW LEVEL SECURITY;

CREATE POLICY sync_operation_effects_member_access ON app.sync_operation_effects
    USING (app.has_business_access(business_id))
    WITH CHECK (app.has_business_access(business_id));

COMMIT;
