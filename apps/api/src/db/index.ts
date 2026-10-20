import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'webmanager',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres_secure_password',
});

export default pool;

export async function runMigrations() {
  try {
    const client = await pool.connect();
    try {
      const migrationsDir = path.join(__dirname, 'migrations');
      if (fs.existsSync(migrationsDir)) {
        const files = fs.readdirSync(migrationsDir).sort();
        for (const file of files) {
          if (file.endsWith('.sql')) {
            const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            await client.query(migrationSql);
          }
        }
      }
      console.log('Database schema migrated successfully.');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
}

export async function seedDatabase() {
  try {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT COUNT(*) FROM users');
      if (parseInt(res.rows[0].count, 10) === 0) {
        console.log('Seeding initial data...');
        const adminHash = await bcrypt.hash('AdminPass123!', 10);
        const managerHash = await bcrypt.hash('ManagerPass123!', 10);
        const customerHash = await bcrypt.hash('CustomerPass123!', 10);
        const vendorHash = await bcrypt.hash('VendorPass123!', 10);

        await client.query(`
          INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
          ('admin@webmanager.local', '${adminHash}', 'Admin', 'User', 'ADMIN'),
          ('manager@webmanager.local', '${managerHash}', 'Manager', 'User', 'MANAGER'),
          ('customer@webmanager.local', '${customerHash}', 'John', 'Doe', 'CUSTOMER'),
          ('vendor@techstore.local', '${vendorHash}', 'TechStore', 'Vendor', 'VENDOR');
        `);

        await client.query(`
          INSERT INTO categories (name, slug, description) VALUES
          ('Électronique', 'electronique', 'Gadgets et équipements électroniques'),
          ('Vêtements', 'vetements', 'Mode et habillement'),
          ('Maison', 'maison', 'Articles pour la maison et déco');
        `);

        const vendorRes = await client.query(`
          INSERT INTO vendors (user_id, company_name, slug, description, logo_url, status) VALUES
          (4, 'TechStore Direct', 'techstore-direct', 'Vendeur certifié spécialisé en high-tech et accessoires.', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5', 'APPROVED')
          RETURNING id;
        `);
        const vendorId = vendorRes.rows[0].id;

        await client.query(`
          INSERT INTO products (category_id, vendor_id, sku, name, slug, description, price, stock, low_stock_threshold, image_url) VALUES
          (1, ${vendorId}, 'ELEC-001', 'Smartphone Pro Max', 'smartphone-pro-max', 'Téléphone haut de gamme écran OLED 120Hz', 999.99, 15, 3, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9'),
          (1, ${vendorId}, 'ELEC-002', 'Casque Audio Sans Fil', 'casque-audio-sans-fil', 'Casque réduction de bruit active', 199.99, 4, 5, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'),
          (2, NULL, 'VET-001', 'T-shirt Coton Bio', 't-shirt-coton-bio', 'T-shirt 100% coton biologique éco-responsable', 29.99, 50, 10, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518');
        `);

        await client.query(`
          INSERT INTO pages (title, slug, content) VALUES
          ('À propos', 'a-propos', 'Bienvenue sur Web Manager. Notre plateforme offre une solution complète pour la gestion e-commerce.'),
          ('Mentions Légales', 'mentions-legales', 'Éditeur du site : Web Manager Inc. Hébergement local et conteneurisé.');
        `);

        console.log('Database seeded successfully.');
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Seeding error:', err);
  }
}
