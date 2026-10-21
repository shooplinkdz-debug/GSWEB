import fs from 'fs';
import path from 'path';
import pool, { runMigrations, seedDatabase } from './db';

describe('Mission 06: PostgreSQL, Schema and Migrations Tests', () => {
  const migrationFilePath = path.join(__dirname, 'db/migrations/001_initial_schema.sql');

  const deliveryMigrationFilePath = path.join(__dirname, 'db/migrations/003_delivery_rates.sql');

  test('Migration file 001_initial_schema.sql should exist', () => {
    expect(fs.existsSync(migrationFilePath)).toBe(true);
  });

  test('Migration file 003_delivery_rates.sql should exist and define delivery_rates schema', () => {
    expect(fs.existsSync(deliveryMigrationFilePath)).toBe(true);
    const sql = fs.readFileSync(deliveryMigrationFilePath, 'utf-8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS delivery_rates');
    expect(sql).toContain('wilaya_code INT UNIQUE NOT NULL');
    expect(sql).toContain('home_fee NUMERIC(10, 2)');
    expect(sql).toContain('desk_fee NUMERIC(10, 2)');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_delivery_rates_wilaya_code ON delivery_rates(wilaya_code)');
  });

  test('Migration SQL should define all core tables with constraints', () => {
    const sql = fs.readFileSync(migrationFilePath, 'utf-8');

    // Tables
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS users');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS categories');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS products');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS pages');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS orders');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS order_items');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS activity_logs');

    // Key constraints & columns
    expect(sql).toContain('email VARCHAR(255) UNIQUE NOT NULL');
    expect(sql).toContain('category_id INT REFERENCES categories(id) ON DELETE SET NULL');
    expect(sql).toContain('order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE');
    expect(sql).toContain('sku VARCHAR(100) UNIQUE NOT NULL');
    expect(sql).toContain('user_id INT REFERENCES users(id) ON DELETE SET NULL');
  });

  test('Migration SQL should create performance indexes', () => {
    const sql = fs.readFileSync(migrationFilePath, 'utf-8');

    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug)');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug)');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id)');
  });

  test('Pool instance and migration / seed exports should be properly defined', () => {
    expect(pool).toBeDefined();
    expect(typeof runMigrations).toBe('function');
    expect(typeof seedDatabase).toBe('function');
  });

  test('runMigrations and seedDatabase should handle offline database gracefully without throwing unhandled rejection', async () => {
    // When DB is offline or mock fails, functions catch and log error
    await expect(runMigrations()).resolves.not.toThrow();
    await expect(seedDatabase()).resolves.not.toThrow();
  });
});
