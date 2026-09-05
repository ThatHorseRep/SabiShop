BEGIN;

CREATE TABLE app.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES app.businesses(id) ON DELETE RESTRICT,
    sku text NOT NULL CHECK (length(trim(sku)) > 0),
    name text NOT NULL CHECK (length(trim(name)) > 0),
    category text NOT NULL CHECK (length(trim(category)) > 0),
    unit text NOT NULL CHECK (length(trim(unit)) > 0),
    model_or_part_number text,
    selling_price_kobo bigint NOT NULL CHECK (selling_price_kobo >= 0),
    price_floor_kobo bigint CHECK (
        price_floor_kobo IS NULL OR
        (price_floor_kobo >= 0 AND price_floor_kobo <= selling_price_kobo)
    ),
    active boolean NOT NULL DEFAULT true,
    available_for_sale boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (business_id, id),
    UNIQUE (business_id, sku)
);

CREATE TABLE app.product_aliases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES app.businesses(id) ON DELETE RESTRICT,
    product_id uuid NOT NULL,
    alias text NOT NULL CHECK (length(trim(alias)) > 0),
    FOREIGN KEY (business_id, product_id)
        REFERENCES app.products (business_id, id) ON DELETE RESTRICT,
    UNIQUE (business_id, product_id, alias)
);

CREATE TABLE app.product_price_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES app.businesses(id) ON DELETE RESTRICT,
    product_id uuid NOT NULL,
    field text NOT NULL CHECK (field IN ('selling_price', 'price_floor')),
    previous_value_kobo bigint CHECK (previous_value_kobo IS NULL OR previous_value_kobo >= 0),
    new_value_kobo bigint CHECK (new_value_kobo IS NULL OR new_value_kobo >= 0),
    changed_by_membership_id uuid NOT NULL,
    changed_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (business_id, product_id)
        REFERENCES app.products (business_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (business_id, changed_by_membership_id)
        REFERENCES app.business_memberships (business_id, id) ON DELETE RESTRICT
);

CREATE INDEX products_search_idx
    ON app.products (business_id, active, available_for_sale, name, sku);

CREATE INDEX product_price_history_idx
    ON app.product_price_history (business_id, product_id, changed_at DESC);

CREATE TRIGGER product_price_history_no_mutation
    BEFORE UPDATE OR DELETE ON app.product_price_history
    FOR EACH ROW EXECUTE FUNCTION app.prevent_audit_mutation();

ALTER TABLE app.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.products FORCE ROW LEVEL SECURITY;
ALTER TABLE app.product_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.product_aliases FORCE ROW LEVEL SECURITY;
ALTER TABLE app.product_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.product_price_history FORCE ROW LEVEL SECURITY;

CREATE POLICY products_member_access ON app.products
    USING (app.has_business_access(business_id))
    WITH CHECK (app.has_business_access(business_id));

CREATE POLICY product_aliases_member_access ON app.product_aliases
    USING (app.has_business_access(business_id))
    WITH CHECK (app.has_business_access(business_id));

CREATE POLICY product_price_history_member_access ON app.product_price_history
    USING (app.has_business_access(business_id))
    WITH CHECK (app.has_business_access(business_id));

CREATE TRIGGER products_set_updated_at
    BEFORE UPDATE ON app.products
    FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

COMMIT;
