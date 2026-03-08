-- Drop existing tables
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Suppliers Table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    reliability_score REAL DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES suppliers(owner_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Warehouses Table
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
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES suppliers(owner_id) ON DELETE CASCADE,
    buyer_owner_id UUID REFERENCES suppliers(owner_id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    origin_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    destination_warehouse_id UUID,
    quantity INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'In Transit', 'Completed', 'Delayed', 'Cancelled')),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    current_lat REAL,
    current_lng REAL,
    transit_temperature REAL,
    transit_humidity REAL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Note on RLS Policies:
-- Since the application manages authentication via custom logic in the frontend 
-- (storing supplier_id in localStorage) and queries using the Supabase anon key, 
-- we allow anon access so the UI queries can successfully filter by 'owner_id'.
-- For a production app utilizing a custom auth flow without Supabase Auth, you 
-- would ideally send the owner_id via custom headers and validate it here.

CREATE POLICY "Allow all operations for anon (Client-side)" ON suppliers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon (Client-side)" ON products FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon (Client-side)" ON warehouses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon (Client-side)" ON inventory FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon (Client-side)" ON shipments FOR ALL TO anon USING (true) WITH CHECK (true);
