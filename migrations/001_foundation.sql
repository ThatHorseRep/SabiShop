BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE app.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_subject text NOT NULL UNIQUE,
    display_name text NOT NULL CHECK (length(trim(display_name)) > 0),
    status text NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'suspended', 'closed')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.businesses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL CHECK (length(trim(name)) > 0),
    status text NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'suspended', 'closed')),
    created_by_user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (id, created_by_user_id)
);

CREATE TABLE app.business_memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES app.businesses(id) ON DELETE RESTRICT,
    user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE RESTRICT,
    role text NOT NULL CHECK (role IN ('owner', 'manager', 'staff', 'salesperson')),
    status text NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'suspended', 'revoked')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (business_id, user_id),
    UNIQUE (business_id, id)
);

CREATE INDEX business_memberships_user_idx
    ON app.business_memberships (user_id, status, business_id);

CREATE TABLE app.devices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES app.businesses(id) ON DELETE RESTRICT,
    membership_id uuid NOT NULL,
    device_key_hash text NOT NULL,
    label text NOT NULL CHECK (length(trim(label)) > 0),
    status text NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'revoked')),
    last_seen_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (business_id, id),
    UNIQUE (business_id, device_key_hash),
    FOREIGN KEY (business_id, membership_id)
        REFERENCES app.business_memberships (business_id, id)
        ON DELETE RESTRICT
);

CREATE INDEX devices_membership_idx
    ON app.devices (business_id, membership_id, status);

CREATE TABLE app.audit_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES app.businesses(id) ON DELETE RESTRICT,
    actor_membership_id uuid,
    event_type text NOT NULL CHECK (length(trim(event_type)) > 0),
    target_type text NOT NULL CHECK (length(trim(target_type)) > 0),
    target_id uuid,
    reason text,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    recorded_at timestamptz NOT NULL DEFAULT now(),
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    FOREIGN KEY (business_id, actor_membership_id)
        REFERENCES app.business_memberships (business_id, id)
        ON DELETE RESTRICT
);

CREATE INDEX audit_events_business_time_idx
    ON app.audit_events (business_id, occurred_at DESC);

CREATE INDEX audit_events_target_idx
    ON app.audit_events (business_id, target_type, target_id, occurred_at DESC);

CREATE TABLE app.sync_operations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES app.businesses(id) ON DELETE RESTRICT,
    device_id uuid NOT NULL,
    membership_id uuid NOT NULL,
    operation_id uuid NOT NULL,
    operation_type text NOT NULL CHECK (length(trim(operation_type)) > 0),
    status text NOT NULL DEFAULT 'received'
        CHECK (status IN ('received', 'accepted', 'rejected', 'conflicted')),
    client_created_at timestamptz NOT NULL,
    received_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    error_code text,
    FOREIGN KEY (business_id, device_id)
        REFERENCES app.devices (business_id, id)
        ON DELETE RESTRICT,
    FOREIGN KEY (business_id, membership_id)
        REFERENCES app.business_memberships (business_id, id)
        ON DELETE RESTRICT,
    UNIQUE (business_id, operation_id),
    CHECK (completed_at IS NULL OR completed_at >= received_at)
);

CREATE INDEX sync_operations_pending_idx
    ON app.sync_operations (business_id, status, received_at);

CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
    SELECT NULLIF(current_setting('app.user_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app.has_business_access(p_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = app
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM app.business_memberships membership
        WHERE membership.business_id = p_business_id
          AND membership.user_id = app.current_user_id()
          AND membership.status = 'active'
    )
$$;

CREATE OR REPLACE FUNCTION app.is_business_creator(p_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = app
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM app.businesses business
        WHERE business.id = p_business_id
          AND business.created_by_user_id = app.current_user_id()
    )
$$;

CREATE OR REPLACE FUNCTION app.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION app.prevent_business_creator_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.created_by_user_id <> OLD.created_by_user_id THEN
        RAISE EXCEPTION 'business creator is immutable';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON app.users
    FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TRIGGER businesses_set_updated_at
    BEFORE UPDATE ON app.businesses
    FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TRIGGER businesses_creator_immutable
    BEFORE UPDATE ON app.businesses
    FOR EACH ROW EXECUTE FUNCTION app.prevent_business_creator_change();

CREATE TRIGGER memberships_set_updated_at
    BEFORE UPDATE ON app.business_memberships
    FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TRIGGER devices_set_updated_at
    BEFORE UPDATE ON app.devices
    FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE OR REPLACE FUNCTION app.prevent_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'audit_events are append-only';
END;
$$;

CREATE TRIGGER audit_events_no_update
    BEFORE UPDATE OR DELETE ON app.audit_events
    FOR EACH ROW EXECUTE FUNCTION app.prevent_audit_mutation();

ALTER TABLE app.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.business_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.sync_operations ENABLE ROW LEVEL SECURITY;

ALTER TABLE app.users FORCE ROW LEVEL SECURITY;
ALTER TABLE app.devices FORCE ROW LEVEL SECURITY;
ALTER TABLE app.audit_events FORCE ROW LEVEL SECURITY;
ALTER TABLE app.sync_operations FORCE ROW LEVEL SECURITY;

CREATE POLICY users_self_access ON app.users
    USING (id = app.current_user_id())
    WITH CHECK (id = app.current_user_id());

CREATE POLICY businesses_member_access ON app.businesses
    USING (app.has_business_access(id))
    WITH CHECK (app.has_business_access(id));

CREATE POLICY businesses_create ON app.businesses
    FOR INSERT
    WITH CHECK (created_by_user_id = app.current_user_id());

CREATE POLICY memberships_member_access ON app.business_memberships
    USING (user_id = app.current_user_id() OR app.has_business_access(business_id))
    WITH CHECK (
        app.has_business_access(business_id)
        OR (
            user_id = app.current_user_id()
            AND app.is_business_creator(business_id)
        )
    );

CREATE POLICY devices_member_access ON app.devices
    USING (app.has_business_access(business_id))
    WITH CHECK (app.has_business_access(business_id));

CREATE POLICY audit_member_access ON app.audit_events
    USING (app.has_business_access(business_id))
    WITH CHECK (app.has_business_access(business_id));

CREATE POLICY sync_member_access ON app.sync_operations
    USING (app.has_business_access(business_id))
    WITH CHECK (app.has_business_access(business_id));

COMMIT;
