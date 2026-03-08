-- ============================================================================
-- ZYPHER — Sample Test Account with Full Data
-- ============================================================================
-- Login:  test@zypher.in  /  pass123
-- This account has data for EVERY page to work properly.
-- Paste this into Supabase SQL Editor and run it.
-- ============================================================================

-- Use a fixed owner_id so all data is linked
-- Owner ID: 55555555-5555-5555-5555-555555555555

-- ============================================================================
-- 1. CREATE THE TEST ACCOUNT
-- ============================================================================
INSERT INTO suppliers (id, owner_id, name, email, password, reliability_score, total_orders, delayed_orders)
VALUES (
    '55555555-5555-5555-5555-555555555555',
    '55555555-5555-5555-5555-555555555555',
    'Zypher Test Corp',
    'test@zypher.in',
    'pass123',
    0.94,
    35,
    3
) ON CONFLICT (email) DO NOTHING;


-- ============================================================================
-- 2. PRODUCTS (4 products — needed for Inventory, Heatmap, Shipments)
-- ============================================================================
INSERT INTO products (id, owner_id, name, category) VALUES
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '55555555-5555-5555-5555-555555555555', 'Lithium Battery Cells', 'Electronics'),
    ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '55555555-5555-5555-5555-555555555555', 'Hydraulic Pumps', 'Machinery'),
    ('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', '55555555-5555-5555-5555-555555555555', 'Carbon Fiber Sheets', 'Raw Materials'),
    ('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', '55555555-5555-5555-5555-555555555555', 'Cooling Modules', 'Electronics');


-- ============================================================================
-- 3. WAREHOUSES (3 warehouses with GPS — needed for Map, Heatmap, Inventory)
-- ============================================================================
INSERT INTO warehouses (id, owner_id, name, location, latitude, longitude) VALUES
    ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', '55555555-5555-5555-5555-555555555555',
     'Chennai Central Hub', 'Chennai, TN', 13.0827, 80.2707),
    ('e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', '55555555-5555-5555-5555-555555555555',
     'Bangalore Tech Park', 'Bangalore, KA', 12.9716, 77.5946),
    ('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3', '55555555-5555-5555-5555-555555555555',
     'Mumbai Port Depot', 'Mumbai, MH', 19.0760, 72.8777);


-- ============================================================================
-- 4. INVENTORY (6 entries — covers Heatmap, Procurement, Simulation)
--    Some items are LOW STOCK to trigger Procurement recommendations
-- ============================================================================
INSERT INTO inventory (id, owner_id, product_id, warehouse_id, stock_quantity, reorder_level) VALUES
    -- Chennai warehouse: healthy + one low stock
    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555',
     'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 800, 150),
    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555',
     'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 30, 100),  -- LOW STOCK → triggers Procurement

    -- Bangalore warehouse: healthy + one critical
    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555',
     'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 450, 100),
    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555',
     'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 5, 50),    -- CRITICAL → triggers Procurement

    -- Mumbai warehouse
    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555',
     'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3', 600, 200),
    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555',
     'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3', 200, 80);


-- ============================================================================
-- 5. SHIPMENTS — Active (for Dashboard, Map, Alerts)
-- ============================================================================
INSERT INTO shipments (
    id, owner_id, buyer_owner_id, product_id, origin_warehouse_id,
    quantity, status, start_time, end_time,
    origin_lat, origin_lng, dest_lat, dest_lng,
    current_lat, current_lng,
    transit_temperature, transit_humidity, weather_condition,
    name, product_name, buyer_name,
    driver_name, driver_phone, truck_number
) VALUES
    -- IN TRANSIT: Chennai → Mumbai (currently near Pune)
    (uuid_generate_v4(),
     '55555555-5555-5555-5555-555555555555', NULL,
     'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1',
     120, 'In Transit', NOW() - INTERVAL '12 hours', NOW() + INTERVAL '8 hours',
     13.0827, 80.2707, 19.0760, 72.8777,
     18.5204, 73.8567,
     23.0, 48.0, 'Clear',
     'Dispatch: Lithium Battery Cells', 'Lithium Battery Cells', 'External Buyer A',
     'Rajesh Kumar', '+919876512345', 'TN 09 BX 1234'),

    -- IN TRANSIT: Bangalore → Chennai (short haul, rain zone)
    (uuid_generate_v4(),
     '55555555-5555-5555-5555-555555555555', NULL,
     'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2',
     60, 'In Transit', NOW() - INTERVAL '3 hours', NOW() + INTERVAL '3 hours',
     12.9716, 77.5946, 13.0827, 80.2707,
     12.9200, 78.9000,
     26.0, 72.0, 'Rain',
     'Dispatch: Carbon Fiber Sheets', 'Carbon Fiber Sheets', 'External Buyer B',
     'Senthil Nathan', '+919876534567', 'MH 12 AB 4567'),

    -- DELAYED: Mumbai → Bangalore (stuck near Hubli)
    (uuid_generate_v4(),
     '55555555-5555-5555-5555-555555555555', NULL,
     'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3',
     80, 'Delayed', NOW() - INTERVAL '2 days', NOW() + INTERVAL '1 day',
     19.0760, 72.8777, 12.9716, 77.5946,
     15.3647, 75.1240,
     28.0, 65.0, 'Storm',
     'Dispatch: Hydraulic Pumps', 'Hydraulic Pumps', 'External Buyer C',
     'Amit Singh', '+919876556789', 'DL 1C AA 1111');


-- ============================================================================
-- 6. SHIPMENTS — Completed History (for Forecast page — needs 5+ records)
-- ============================================================================
INSERT INTO shipments (
    id, owner_id, buyer_owner_id, product_id, origin_warehouse_id,
    quantity, status, start_time, end_time,
    origin_lat, origin_lng, dest_lat, dest_lng,
    transit_temperature, transit_humidity, weather_condition,
    name, product_name, buyer_name,
    driver_name, driver_phone, truck_number
) VALUES
    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555', NULL,
     'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1',
     150, 'Completed', NOW() - INTERVAL '28 days', NOW() - INTERVAL '26 days',
     13.0827, 80.2707, 19.0760, 72.8777,
     22.0, 45.0, 'Clear',
     'Dispatch: Lithium Battery Cells', 'Lithium Battery Cells', 'Buyer X',
     'Rajesh Kumar', '+919876512345', 'TN 09 BX 1234'),

    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555', NULL,
     'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2',
     200, 'Completed', NOW() - INTERVAL '24 days', NOW() - INTERVAL '22 days',
     12.9716, 77.5946, 13.0827, 80.2707,
     24.0, 50.0, 'Clear',
     'Dispatch: Hydraulic Pumps', 'Hydraulic Pumps', 'Buyer Y',
     'Murugan S', '+919876523456', 'KA 01 MH 8899'),

    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555', NULL,
     'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1',
     90, 'Completed', NOW() - INTERVAL '20 days', NOW() - INTERVAL '18 days',
     13.0827, 80.2707, 12.9716, 77.5946,
     23.0, 55.0, 'Rain',
     'Dispatch: Carbon Fiber Sheets', 'Carbon Fiber Sheets', 'Buyer Z',
     'Senthil Nathan', '+919876534567', 'MH 12 AB 4567'),

    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555', NULL,
     'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3',
     180, 'Completed', NOW() - INTERVAL '15 days', NOW() - INTERVAL '13 days',
     19.0760, 72.8777, 13.0827, 80.2707,
     25.0, 48.0, 'Clear',
     'Dispatch: Lithium Battery Cells', 'Lithium Battery Cells', 'Buyer X',
     'Amit Singh', '+919876556789', 'DL 1C AA 1111'),

    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555', NULL,
     'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2',
     110, 'Completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days',
     12.9716, 77.5946, 19.0760, 72.8777,
     22.0, 42.0, 'Clear',
     'Dispatch: Cooling Modules', 'Cooling Modules', 'Buyer W',
     'Vikram Reddy', '+919876567890', 'TS 08 XY 9999'),

    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555', NULL,
     'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1',
     75, 'Completed', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days',
     13.0827, 80.2707, 12.9716, 77.5946,
     24.0, 58.0, 'Clear',
     'Dispatch: Hydraulic Pumps', 'Hydraulic Pumps', 'Buyer Y',
     'Rajesh Kumar', '+919876512345', 'TN 09 BX 1234'),

    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555', NULL,
     'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3',
     130, 'Completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days',
     19.0760, 72.8777, 12.9716, 77.5946,
     21.0, 50.0, 'Clear',
     'Dispatch: Carbon Fiber Sheets', 'Carbon Fiber Sheets', 'Buyer Z',
     'Murugan S', '+919876523456', 'KA 01 MH 8899'),

    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555', NULL,
     'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1',
     95, 'Completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '12 hours',
     13.0827, 80.2707, 19.0760, 72.8777,
     23.0, 46.0, 'Clear',
     'Dispatch: Lithium Battery Cells', 'Lithium Battery Cells', 'Buyer X',
     'Senthil Nathan', '+919876534567', 'MH 12 AB 4567');


-- ============================================================================
-- DONE! Test account ready.
-- ============================================================================
-- Login:   test@zypher.in  /  pass123
--
-- What each page will show:
--   Dashboard   → 2 active dispatches, 1 delayed, 2 low-stock alerts, 7 total assets
--   Shipments   → 3 live routes on map (Chennai→Mumbai, Bangalore→Chennai, Mumbai→Bangalore)
--   Inventory   → 6 items across 3 warehouses (2 critical stock items)
--   Forecast    → Real AI forecast from 8 completed shipments (no fake data)
--   Heatmap     → 3 warehouses × 4 products grid with real intensity
--   Procurement → 2 items flagged for reorder (Hydraulic Pumps + Cooling Modules)
--   Simulation  → Base stock of ~2085 units for stress testing
--   Suppliers   → Shows all suppliers with 94% reliability score
-- ============================================================================
