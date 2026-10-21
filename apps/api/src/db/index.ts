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

      const delivRes = await client.query('SELECT COUNT(*) FROM delivery_rates');
      if (parseInt(delivRes.rows[0].count, 10) === 0) {
        console.log('Seeding Algeria wilayas delivery rates...');
        const wilayas: Array<[number, string, string, number, number]> = [
          [1, 'Adrar', 'أدرار', 900.00, 600.00],
          [2, 'Chlef', 'الشلف', 600.00, 400.00],
          [3, 'Laghouat', 'الأغواط', 700.00, 500.00],
          [4, 'Oum El Bouaghi', 'أم البواقي', 600.00, 400.00],
          [5, 'Batna', 'باتنة', 600.00, 400.00],
          [6, 'Béjaïa', 'بجاية', 600.00, 400.00],
          [7, 'Biskra', 'بسكرة', 700.00, 500.00],
          [8, 'Béchar', 'بشار', 800.00, 600.00],
          [9, 'Blida', 'البليدة', 500.00, 300.00],
          [10, 'Bouira', 'البويرة', 500.00, 300.00],
          [11, 'Tamanrasset', 'تمنراست', 1000.00, 700.00],
          [12, 'Tébessa', 'تبسة', 700.00, 500.00],
          [13, 'Tlemcen', 'تلمسان', 700.00, 500.00],
          [14, 'Tiaret', 'تيارت', 600.00, 400.00],
          [15, 'Tizi Ouzou', 'تيزي وزو', 500.00, 300.00],
          [16, 'Alger', 'الجزائر', 400.00, 250.00],
          [17, 'Djelfa', 'الجلفة', 600.00, 400.00],
          [18, 'Jijel', 'جيجل', 600.00, 400.00],
          [19, 'Sétif', 'سطيف', 600.00, 400.00],
          [20, 'Saïda', 'سعيدة', 600.00, 400.00],
          [21, 'Skikda', 'سكيكدة', 600.00, 400.00],
          [22, 'Sidi Bel Abbès', 'سيدي بلعباس', 600.00, 400.00],
          [23, 'Annaba', 'عنابة', 600.00, 400.00],
          [24, 'Guelma', 'قالمة', 600.00, 400.00],
          [25, 'Constantine', 'قسنطينة', 600.00, 400.00],
          [26, 'Médéa', 'المدية', 500.00, 300.00],
          [27, 'Mostaganem', 'مستغانم', 600.00, 400.00],
          [28, "M'Sila", 'المسيلة', 600.00, 400.00],
          [29, 'Mascara', 'معسكر', 600.00, 400.00],
          [30, 'Ouargla', 'ورقلة', 800.00, 600.00],
          [31, 'Oran', 'وهران', 600.00, 400.00],
          [32, 'El Bayadh', 'البيض', 800.00, 600.00],
          [33, 'Illizi', 'إليزي', 1000.00, 700.00],
          [34, 'Bordj Bou Arreridj', 'برج بوعريريج', 600.00, 400.00],
          [35, 'Boumerdès', 'بومرداس', 450.00, 300.00],
          [36, 'El Tarf', 'الطارف', 700.00, 500.00],
          [37, 'Tindouf', 'تندوف', 1000.00, 700.00],
          [38, 'Tissemsilt', 'تيسمسيلت', 600.00, 400.00],
          [39, 'El Oued', 'الوادي', 800.00, 600.00],
          [40, 'Khenchela', 'خنشلة', 700.00, 500.00],
          [41, 'Souk Ahras', 'سوق أهراس', 700.00, 500.00],
          [42, 'Tipaza', 'تيبازة', 450.00, 300.00],
          [43, 'Mila', 'ميلة', 600.00, 400.00],
          [44, 'Aïn Defla', 'عين الدفلى', 550.00, 350.00],
          [45, 'Naâma', 'النعامة', 800.00, 600.00],
          [46, 'Aïn Témouchent', 'عين تموشنت', 650.00, 450.00],
          [47, 'Ghardaïa', 'غرداية', 800.00, 600.00],
          [48, 'Relizane', 'غليزان', 600.00, 400.00],
          [49, 'Timimoun', 'تيميمون', 950.00, 650.00],
          [50, 'Bordj Badji Mokhtar', 'برج باجي مختار', 1100.00, 800.00],
          [51, 'Ouled Djellal', 'أولاد جلال', 750.00, 550.00],
          [52, 'Béni Abbès', 'بني عباس', 900.00, 650.00],
          [53, 'In Salah', 'عين صالح', 1000.00, 700.00],
          [54, 'In Guezzam', 'عين قزام', 1100.00, 800.00],
          [55, 'Touggourt', 'تقرت', 800.00, 600.00],
          [56, 'Djanet', 'جانت', 1100.00, 800.00],
          [57, "El M'Ghair", 'المغير', 800.00, 600.00],
          [58, 'El Meniaa', 'المنيعة', 900.00, 650.00],
        ];

        const values = wilayas.map(([code, name, nameAr, home, desk]) =>
          `(${code}, '${name.replace(/'/g, "''")}', '${nameAr}', ${home}, ${desk})`
        ).join(',\n');

        await client.query(`
          INSERT INTO delivery_rates (wilaya_code, wilaya_name, wilaya_name_ar, home_fee, desk_fee) VALUES
          ${values}
          ON CONFLICT (wilaya_code) DO NOTHING;
        `);
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Seeding error:', err);
  }
}
