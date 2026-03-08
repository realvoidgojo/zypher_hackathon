-- Clean up existing data first
TRUNCATE TABLE shipments, inventory, warehouses, products, suppliers RESTART IDENTITY CASCADE;

-- Insert Sample Suppliers (Network Nodes)
INSERT INTO suppliers (id, owner_id, name, email, password, reliability_score) VALUES
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Zypher Global Logistics', 'operator@zypher.network', 'pass123', 0.98),
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Alpha Suppliers Ltd.', 'alpha@supplier.com', 'pass123', 0.92),
  ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Beta Manufacturing', 'beta@supplier.com', 'pass123', 0.85);

-- Insert Sample Products
INSERT INTO products (id, owner_id, name, category) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Industrial Solvents', 'Chemicals'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Microprocessors', 'Electronics'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Medical Grade Steel', 'Raw Materials');

-- Insert Sample Warehouses
INSERT INTO warehouses (id, owner_id, name, location, latitude, longitude) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'Central Hub Chennai', 'Chennai, India', 13.0827, 80.2707),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'Mumbai Distribution', 'Mumbai, India', 19.0760, 72.8777),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '22222222-2222-2222-2222-222222222222', 'Alpha Storage Delhi', 'New Delhi, India', 28.6139, 77.2090);

-- Insert Sample Inventory
INSERT INTO inventory (id, owner_id, product_id, warehouse_id, stock_quantity, reorder_level) VALUES
  (uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 500, 100),
  (uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1200, 300),
  (uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 50, 150); -- Needs Reorder

-- Insert Sample Shipments
INSERT INTO shipments (id, owner_id, buyer_owner_id, product_id, origin_warehouse_id, quantity, status, start_time, end_time, current_lat, current_lng, transit_temperature, transit_humidity) VALUES
  (uuid_generate_v4(), '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 200, 'In Transit', NOW() - INTERVAL '1 day', NOW() + INTERVAL '2 days', 21.1458, 79.0882, 22.5, 45.0),
  (uuid_generate_v4(), '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, 1000, 'Completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day', NULL, NULL, 18.0, 50.0),
  (uuid_generate_v4(), '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 500, 'Delayed', NOW() - INTERVAL '3 days', NOW() + INTERVAL '4 days', 23.2599, 77.4126, 25.0, 60.0);
