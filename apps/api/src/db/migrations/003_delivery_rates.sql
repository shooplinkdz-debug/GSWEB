-- Migration 003: Delivery rates for Algeria Wilayas

CREATE TABLE IF NOT EXISTS delivery_rates (
  id SERIAL PRIMARY KEY,
  wilaya_code INT UNIQUE NOT NULL,
  wilaya_name VARCHAR(100) NOT NULL,
  wilaya_name_ar VARCHAR(100),
  home_fee NUMERIC(10, 2) NOT NULL DEFAULT 600.00,
  desk_fee NUMERIC(10, 2) NOT NULL DEFAULT 400.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_delivery_rates_wilaya_code ON delivery_rates(wilaya_code);
CREATE INDEX IF NOT EXISTS idx_delivery_rates_is_active ON delivery_rates(is_active);
