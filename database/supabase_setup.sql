-- ============================================================================
-- ZYPHER LOGISTICS OS — Complete Supabase Setup Script
-- ============================================================================
-- Generated after full project audit.
-- Paste this ENTIRE script into the Supabase SQL Editor and run it once.
-- It will create all tables, enable RLS, set policies, and seed demo data.
-- ============================================================================


-- ============================================================================
-- STEP 1: CLEANUP (Safe to run on a fresh project)
-- ============================================================================
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;


-- ============================================================================
-- STEP 2: EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================================
-- STEP 3: CREATE TABLES
-- ============================================================================

-- 1. Suppliers Table (Also acts as the User/Account table)
--    The frontend authenticates by matching email+password against this table.
--    `owner_id` is stored in localStorage as `supplier_id` and used to filter
--    ALL subsequent queries across every table.
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    reliability_score REAL DEFAULT 1.0,
    total_orders INTEGER DEFAULT 0,
    delayed_orders INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products Table
--    Each product belongs to one supplier (via owner_id).
--    Referenced by: inventory, shipments.
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES suppliers(owner_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Warehouses Table
--    Physical storage locations with GPS coordinates (used for map rendering).
--    Each warehouse belongs to one supplier (via owner_id).
--    Referenced by: inventory, shipments (origin_warehouse_id).
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES suppliers(owner_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT,
    latitude REAL,
    longitude REAL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Inventory Table
--    Links a product to a warehouse with stock quantities.
--    The UNIQUE constraint on (product_id, warehouse_id) prevents duplicate entries.
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES suppliers(owner_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, warehouse_id)
);

-- 5. Shipments Table
--    Tracks goods movement between locations. This is the most complex table
--    because the frontend uses MANY columns for real-time map rendering,
--    route calculation, weather overlays, and driver simulation.
--
--    IMPORTANT: The original AI-generated schema was MISSING 8 columns that
--    the frontend actively reads/writes. They are all included below.
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES suppliers(owner_id) ON DELETE CASCADE,
    buyer_owner_id UUID REFERENCES suppliers(owner_id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    origin_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    destination_warehouse_id UUID,
    quantity INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'Pending', 'In Transit', 'Completed', 'Delayed', 'Cancelled', 'Delivered'
    )),
    -- Timestamps
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    estimated_delivery_time TIMESTAMPTZ,
    -- Legacy position columns (from original schema, kept for seed data compat)
    current_lat REAL,
    current_lng REAL,
    -- Route endpoint columns (REQUIRED by ShipmentMap + ShipmentManager)
    origin_lat REAL,
    origin_lng REAL,
    dest_lat REAL,
    dest_lng REAL,
    -- Transit environment
    transit_temperature REAL,
    transit_humidity REAL,
    weather_condition TEXT DEFAULT 'Clear',
    -- Display metadata
    name TEXT,
    product_name TEXT,
    buyer_name TEXT,
    -- Driver & Vehicle (stored per-shipment, no more hardcoded arrays)
    driver_name TEXT,
    driver_phone TEXT,
    truck_number TEXT,
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- STEP 5: RLS POLICIES
-- ============================================================================
--
-- ARCHITECTURE NOTE:
-- This app uses a CUSTOM authentication model (not Supabase Auth).
-- The frontend stores `owner_id` in localStorage and queries Supabase
-- using the public anon key. Since there is no JWT-based auth.uid(),
-- we cannot write row-level filters like `USING (owner_id = auth.uid())`.
--
-- Therefore, the policies below allow full access for the `anon` role.
-- The frontend enforces data isolation by always filtering with
-- `.eq('owner_id', sid)` in every query.
--
-- FOR PRODUCTION: Migrate to Supabase Auth (or a custom JWT flow via
-- Edge Functions) so RLS can enforce `owner_id = auth.uid()` server-side.
-- ============================================================================

CREATE POLICY "anon_full_access" ON suppliers
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_full_access" ON products
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_full_access" ON warehouses
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_full_access" ON inventory
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_full_access" ON shipments
    FOR ALL TO anon USING (true) WITH CHECK (true);


-- ============================================================================
-- STEP 6: ENABLE REALTIME
-- ============================================================================
-- The dashboard and inventory pages subscribe to postgres_changes.
-- Supabase requires tables to be added to the realtime publication.
-- (If the `supabase_realtime` publication already exists, ALTER it.)
-- ============================================================================

DO $$
BEGIN
    -- Try adding tables to the existing realtime publication
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE suppliers;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE products;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE warehouses;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE shipments;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;


-- ============================================================================
-- STEP 7: SEED DATA
-- ============================================================================
-- Demo accounts, products, warehouses, inventory, and shipments.
-- You can log in with any of the emails below using password: pass123
-- ============================================================================

-- 7a. Suppliers (User Accounts)
INSERT INTO suppliers (id, owner_id, name, email, password, reliability_score, total_orders, delayed_orders) VALUES
    ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
     'Zypher Global Logistics', 'operator@b2b.in', 'pass123', 0.98, 45, 2),
    ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
     'Pune Suppliers Ltd.', 'pune@b2b.in', 'pass123', 0.92, 30, 5),
    ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
     'Delhi Manufacturing', 'delhi@b2b.in', 'pass123', 0.85, 18, 6),
    ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444',
     'Madras Supply Chain Co.', 'chennai@b2b.in', 'pass123', 0.95, 22, 1);

-- 7b. Products
INSERT INTO products (id, owner_id, name, category) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
     'Industrial Solvents', 'Chemicals'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111',
     'Microprocessors', 'Electronics'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111',
     'Medical Grade Steel', 'Raw Materials');

-- 7c. Warehouses
INSERT INTO warehouses (id, owner_id, name, location, latitude, longitude) VALUES
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111',
     'Sriperumbudur Tech Hub', 'Chennai, TN', 12.9804, 79.9515),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111',
     'Ennore Port Logistics', 'Chennai, TN', 13.2300, 80.3300),
    ('99999999-9999-9999-9999-999999999999', '44444444-4444-4444-4444-444444444444',
     'Guindy Industrial Estate Hub', 'Chennai, TN', 13.0128, 80.2039),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', '22222222-2222-2222-2222-222222222222',
     'Pune Storage Delhi', 'Okhla, Delhi', 28.5355, 77.2728);

-- 7d. Inventory
INSERT INTO inventory (id, owner_id, product_id, warehouse_id, stock_quantity, reorder_level) VALUES
    (uuid_generate_v4(), '11111111-1111-1111-1111-111111111111',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 500, 100),
    (uuid_generate_v4(), '11111111-1111-1111-1111-111111111111',
     'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1200, 300),
    (uuid_generate_v4(), '44444444-4444-4444-4444-444444444444',
     'cccccccc-cccc-cccc-cccc-cccccccccccc', '99999999-9999-9999-9999-999999999999', 300, 50);

-- 7e. Shipments (with ALL columns the frontend needs)
INSERT INTO shipments (
    id, owner_id, buyer_owner_id, product_id, origin_warehouse_id,
    quantity, status, start_time, end_time,
    origin_lat, origin_lng, dest_lat, dest_lng,
    current_lat, current_lng,
    transit_temperature, transit_humidity, weather_condition,
    name, product_name, buyer_name
) VALUES
    -- In Transit: Delhi → Chennai (currently near Hyderabad)
    (uuid_generate_v4(),
     '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444',
     'cccccccc-cccc-cccc-cccc-cccccccccccc', 'ffffffff-ffff-ffff-ffff-ffffffffffff',
     200, 'In Transit', NOW() - INTERVAL '1 day', NOW() + INTERVAL '2 days',
     28.5355, 77.2728, 13.0128, 80.2039,
     17.3850, 78.4867,
     22.5, 45.0, 'Clear',
     'Dispatch: Medical Grade Steel', 'Medical Grade Steel', 'Madras Supply Chain Co.'),

    -- Local Chennai: Sriperumbudur → Guindy
    (uuid_generate_v4(),
     '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444',
     'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
     50, 'In Transit', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '4 hours',
     12.9804, 79.9515, 13.0128, 80.2039,
     13.0067, 80.0612,
     24.0, 55.0, 'Clear',
     'Dispatch: Microprocessors', 'Microprocessors', 'Madras Supply Chain Co.'),

    -- Completed: Historic delivery
    (uuid_generate_v4(),
     '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL,
     1000, 'Completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day',
     28.6139, 77.2090, 12.9804, 79.9515,
     NULL, NULL,
     18.0, 50.0, 'Clear',
     'Dispatch: Industrial Solvents', 'Industrial Solvents', 'Zypher Global Logistics'),

    -- Delayed: Delhi → Chennai, stuck near Nagpur
    (uuid_generate_v4(),
     '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
     'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ffffffff-ffff-ffff-ffff-ffffffffffff',
     500, 'Delayed', NOW() - INTERVAL '3 days', NOW() + INTERVAL '4 days',
     28.5355, 77.2728, 12.9804, 79.9515,
     21.1458, 79.0882,
     25.0, 60.0, 'Rain',
     'Dispatch: Microprocessors', 'Microprocessors', 'Zypher Global Logistics');


-- ============================================================================
-- DONE! Your Supabase database is ready.
-- ============================================================================
-- Login credentials for testing:
--   operator@b2b.in  / pass123  → Zypher Global Logistics
--   pune@b2b.in      / pass123  → Pune Suppliers Ltd.
--   delhi@b2b.in     / pass123  → Delhi Manufacturing
--   chennai@b2b.in / pass123 → Madras Supply Chain Co.
-- ============================================================================
