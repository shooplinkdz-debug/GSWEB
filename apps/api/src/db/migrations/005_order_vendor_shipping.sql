-- Migration 005: Order items vendor support and shipping fees

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS vendor_id INT REFERENCES vendors(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(10, 2) DEFAULT 0.00;

CREATE INDEX IF NOT EXISTS idx_order_items_vendor_id ON order_items(vendor_id);
