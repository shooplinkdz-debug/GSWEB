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
      console.log('Seeding initial data...');
      const adminHash = await bcrypt.hash('AdminPass123!', 10);
      const managerHash = await bcrypt.hash('ManagerPass123!', 10);
      const confirmateurHash = await bcrypt.hash('ConfirmateurPass123!', 10);
      const devHash = await bcrypt.hash('DevPass123!', 10);
      const customerHash = await bcrypt.hash('CustomerPass123!', 10);
      const vendorHash = await bcrypt.hash('VendorPass123!', 10);

      // 1. Seed Users
      await client.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
        ('admin@webmanager.local', '${adminHash}', 'Admin', 'User', 'ADMIN'),
        ('manager@webmanager.local', '${managerHash}', 'Manager', 'User', 'MANAGER'),
        ('confirmateur@webmanager.local', '${confirmateurHash}', 'Confirmateur', 'User', 'CONFIRMATEUR'),
        ('developer@webmanager.local', '${devHash}', 'Dev', 'User', 'DEVELOPER'),
        ('customer@webmanager.local', '${customerHash}', 'Karim', 'Benali', 'CUSTOMER'),
        ('vendor@techstore.local', '${vendorHash}', 'TechStore', 'Vendor', 'VENDOR'),
        ('vendor2@fashionplus.local', '${vendorHash}', 'FashionPlus', 'Vendor', 'VENDOR'),
        ('vendor3@autopart.local', '${vendorHash}', 'AutoPart', 'DZ', 'VENDOR'),
        ('vendor4@decohouse.local', '${vendorHash}', 'DecoHouse', 'Vendor', 'VENDOR')
        ON CONFLICT (email) DO NOTHING;
      `);

      // 2. Seed Categories
      await client.query(`
        INSERT INTO categories (name, slug, description) VALUES
        ('Électronique', 'electronique', 'Gadgets, smartphones et équipements électroniques'),
        ('Vêtements', 'vetements', 'Mode, chaussures et habillement hommes/femmes'),
        ('Maison', 'maison', 'Articles pour la maison, décoration et électroménager'),
        ('Beauté', 'beaute', 'Soins, cosmétiques et parfumerie'),
        ('Auto-Moto', 'auto-moto', 'Pièces détachées, entretien et accessoires véhicules'),
        ('Jardin', 'jardin', 'Bricolage, jardinage et outillage'),
        ('Sport', 'sport', 'Équipements sportifs, vêtements et fitness'),
        ('Enfants', 'enfants', 'Jouets, puériculture et vêtements enfants')
        ON CONFLICT (slug) DO NOTHING;
      `);

      // Get Category IDs
      const catRows = await client.query(`SELECT id, slug FROM categories`);
      const catMap: Record<string, number> = {};
      catRows.rows.forEach(r => { catMap[r.slug] = r.id; });

      // 3. Seed Vendors
      const vendorUser1 = await client.query(`SELECT id FROM users WHERE email = 'vendor@techstore.local'`);
      const vendorUser2 = await client.query(`SELECT id FROM users WHERE email = 'vendor2@fashionplus.local'`);
      const vendorUser3 = await client.query(`SELECT id FROM users WHERE email = 'vendor3@autopart.local'`);
      const vendorUser4 = await client.query(`SELECT id FROM users WHERE email = 'vendor4@decohouse.local'`);

      const getOrInsertVendor = async (uId: number, company: string, slug: string, desc: string, logo: string, wilaya: string, rate: number) => {
        const v = await client.query(`
          INSERT INTO vendors (user_id, company_name, slug, description, logo_url, wilaya, commission_rate, status) VALUES
          (${uId}, '${company}', '${slug}', '${desc}', '${logo}', '${wilaya}', ${rate}, 'APPROVED')
          ON CONFLICT (slug) DO NOTHING
          RETURNING id;
        `);
        if (v.rows.length > 0) return v.rows[0].id;
        const vExisting = await client.query(`SELECT id FROM vendors WHERE slug = '${slug}'`);
        return vExisting.rows.length > 0 ? vExisting.rows[0].id : null;
      };

      let vId1 = vendorUser1.rows.length > 0 ? await getOrInsertVendor(vendorUser1.rows[0].id, 'TechStore Direct', 'techstore-direct', 'Vendeur certifié spécialisé en high-tech et accessoires.', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5', 'Blida', 8.50) : null;
      let vId2 = vendorUser2.rows.length > 0 ? await getOrInsertVendor(vendorUser2.rows[0].id, 'Fashion Plus', 'fashion-plus', 'Boutique spécialisée en habillement et accessoires de mode.', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8', 'Alger', 10.00) : null;
      let vId3 = vendorUser3.rows.length > 0 ? await getOrInsertVendor(vendorUser3.rows[0].id, 'AutoPart DZ', 'autopart-dz', 'Pièces automobiles d origine et accessoires d entretien.', 'https://images.unsplash.com/photo-1486006920555-c77dce18193b', 'Oran', 12.00) : null;
      let vId4 = vendorUser4.rows.length > 0 ? await getOrInsertVendor(vendorUser4.rows[0].id, 'Deco House', 'deco-house', 'Mobilier, luminaires et décoration d intérieur artisanale.', 'https://images.unsplash.com/photo-1513694203232-719a280e022f', 'Constantine', 9.00) : null;

      // 4. Seed Products
      const productsData = [
        [catMap['electronique'] || 1, vId1, 'ELEC-001', 'Smartphone Pro Max 256GB', 'smartphone-pro-max', 'Téléphone haut de gamme écran OLED 120Hz 256GB', 125000.00, 15, 3, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9'],
        [catMap['electronique'] || 1, vId1, 'ELEC-002', 'Casque Audio Sans Fil ANC', 'casque-audio-sans-fil', 'Casque bluetooth avec réduction de bruit active', 24000.00, 4, 5, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'],
        [catMap['electronique'] || 1, vId1, 'ELEC-003', 'Montre Connectée Sport GPS', 'montre-connectee-sport', 'Montre intelligente avec capteur cardiaque et suivi GPS', 18500.00, 20, 4, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'],
        [catMap['vetements'] || 2, vId2, 'VET-001', 'T-shirt Coton Bio Premium', 't-shirt-coton-bio', 'T-shirt 100% coton biologique éco-responsable', 3500.00, 50, 10, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518'],
        [catMap['vetements'] || 2, vId2, 'VET-002', 'Veste en Jean Klassik', 'veste-en-jean-klassik', 'Veste denim coupe classique style urbain', 8900.00, 12, 3, 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0'],
        [catMap['vetements'] || 2, vId2, 'VET-003', 'Baskets Casual Comfort', 'baskets-casual-comfort', 'Baskets de ville respirantes et semelle à mémoire de forme', 9800.00, 2, 5, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'],
        [catMap['auto-moto'] || 5, vId3, 'AUTO-001', 'Huile Moteur Synthese 5W40 5L', 'huile-moteur-synthese-5w40', 'Huile moteur synthétique haute performance 5 litres', 6500.00, 30, 5, 'https://images.unsplash.com/photo-1486006920555-c77dce18193b'],
        [catMap['auto-moto'] || 5, vId3, 'AUTO-002', 'Kit Ampoules LED H7 Pro', 'kit-ampoules-led-h7', 'Paire d ampoules LED haute luminosité pour projecteurs', 4200.00, 18, 4, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d'],
        [catMap['maison'] || 3, vId4, 'MAIS-001', 'Lampe de Table Design Bois', 'lampe-de-table-design-bois', 'Lampe d ambiance sur pied en bois naturel sculpté', 7200.00, 8, 2, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c'],
        [catMap['maison'] || 3, vId4, 'MAIS-002', 'Tapis Artisanal Laine 160x230', 'tapis-artisanal-laine', 'Tapis traditionnel tissé main en laine naturelle', 22000.00, 5, 2, 'https://images.unsplash.com/photo-1600121848594-d8644e57abab']
      ];

      for (const p of productsData) {
        await client.query(`
          INSERT INTO products (category_id, vendor_id, sku, name, slug, description, price, stock, low_stock_threshold, image_url)
          VALUES (${p[0]}, ${p[1] || 'NULL'}, '${p[2]}', '${p[3]}', '${p[4]}', '${p[5]}', ${p[6]}, ${p[7]}, ${p[8]}, '${p[9]}')
          ON CONFLICT (slug) DO NOTHING;
        `);
      }

      // Get Product IDs
      const prodRows = await client.query(`SELECT id, slug, name, price, vendor_id FROM products`);
      const prodMap: Record<string, any> = {};
      prodRows.rows.forEach(r => { prodMap[r.slug] = r; });

      // 5. Seed Orders & Order Items
      const customerRow = await client.query(`SELECT id FROM users WHERE email = 'customer@webmanager.local'`);
      const custId = customerRow.rows.length > 0 ? customerRow.rows[0].id : null;

      const ordersToSeed = [
        {
          num: 'CMD-2025-001',
          name: 'Karim Benali',
          email: 'karim.benali@gmail.com',
          phone: '+213 550 12 34 56',
          address: 'Cité 1000 Logements, Wilaya de Blida',
          total: 125000.00,
          status: 'DELIVERED',
          is_confirmed: true,
          items: [
            { slug: 'smartphone-pro-max', qty: 1, price: 125000.00, vendor_id: vId1 }
          ]
        },
        {
          num: 'CMD-2025-002',
          name: 'Amina Khelifi',
          email: 'amina.khelifi@yahoo.fr',
          phone: '+213 661 98 76 54',
          address: 'Rue Hassiba Ben Bouali, Alger Centre, Wilaya d Alger',
          total: 12400.00,
          status: 'IN_PREPARATION',
          is_confirmed: true,
          items: [
            { slug: 't-shirt-coton-bio', qty: 1, price: 3500.00, vendor_id: vId2 },
            { slug: 'veste-en-jean-klassik', qty: 1, price: 8900.00, vendor_id: vId2 }
          ]
        },
        {
          num: 'CMD-2025-003',
          name: 'Yassine Boudiaf',
          email: 'yassine.boudiaf@gmail.com',
          phone: '+213 770 45 12 89',
          address: 'Boulevard de l Armée de Libération, Oran',
          total: 10700.00,
          status: 'PENDING',
          is_confirmed: false,
          items: [
            { slug: 'huile-moteur-synthese-5w40', qty: 1, price: 6500.00, vendor_id: vId3 },
            { slug: 'kit-ampoules-led-h7', qty: 1, price: 4200.00, vendor_id: vId3 }
          ]
        },
        {
          num: 'CMD-2025-004',
          name: 'Fatima Zohra Mansouri',
          email: 'fatima.mansouri@outlook.com',
          phone: '+213 552 33 44 55',
          address: 'Cité Bellevue, Constantine',
          total: 22000.00,
          status: 'CONFIRMED',
          is_confirmed: true,
          items: [
            { slug: 'tapis-artisanal-laine', qty: 1, price: 22000.00, vendor_id: vId4 }
          ]
        }
      ];

      for (const o of ordersToSeed) {
        const commAmt = o.total * 0.10;
        const payout = o.total - commAmt;
        const oRes = await client.query(`
          INSERT INTO orders (order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, total_amount, status, payment_method, is_confirmed, commission_amount, vendor_payout)
          VALUES ('${o.num}', ${custId || 'NULL'}, '${o.name}', '${o.email}', '${o.phone}', '${o.address}', ${o.total}, '${o.status}', 'COD', ${o.is_confirmed}, ${commAmt}, ${payout})
          ON CONFLICT (order_number) DO NOTHING
          RETURNING id;
        `);

        let orderId = oRes.rows.length > 0 ? oRes.rows[0].id : null;
        if (!orderId) {
          const oEx = await client.query(`SELECT id FROM orders WHERE order_number = '${o.num}'`);
          if (oEx.rows.length > 0) orderId = oEx.rows[0].id;
        }

        if (orderId) {
          for (const item of o.items) {
            const pr = prodMap[item.slug];
            const pId = pr ? pr.id : null;
            const pName = pr ? pr.name.replace(/'/g, "''") : item.slug;
            const itemComm = (item.price * item.qty) * 0.10;
            const itemPayout = (item.price * item.qty) - itemComm;

            await client.query(`
              INSERT INTO order_items (order_id, product_id, vendor_id, product_name, unit_price, quantity, commission_rate, commission_amount, vendor_payout)
              VALUES (${orderId}, ${pId || 'NULL'}, ${item.vendor_id || 'NULL'}, '${pName}', ${item.price}, ${item.qty}, 10.00, ${itemComm}, ${itemPayout});
            `);
          }
        }
      }

      // 6. Seed Subscriptions
      if (vId1) {
        await client.query(`
          INSERT INTO subscriptions (vendor_id, plan_name, start_date, end_date, status, notes)
          VALUES (${vId1}, 'Pack Pro Vendeur MBA', CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP + INTERVAL '335 days', 'ACTIVE', 'Abonnement Annuel Illimité')
          ON CONFLICT DO NOTHING;
        `);
      }
      if (vId2) {
        await client.query(`
          INSERT INTO subscriptions (vendor_id, plan_name, start_date, end_date, status, notes)
          VALUES (${vId2}, 'Pack Standard Vendeur', CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP + INTERVAL '15 days', 'ACTIVE', 'Renouvellement mensuel automatique')
          ON CONFLICT DO NOTHING;
        `);
      }

      // 7. Seed Financial Movements
      if (vId1) {
        await client.query(`
          INSERT INTO financial_movements (vendor_id, type, amount, description, category, status) VALUES
          (${vId1}, 'BENEFIT', 112500.00, 'Vente nettoyée commande CMD-2025-001 (Smartphone Pro)', 'VENTES', 'VALIDATED'),
          (${vId1}, 'EXPENSE', 5000.00, 'Abonnement mensuel espace publicitaire', 'MARKETING', 'VALIDATED')
          ON CONFLICT DO NOTHING;
        `);
      }
      if (vId2) {
        await client.query(`
          INSERT INTO financial_movements (vendor_id, type, amount, description, category, status) VALUES
          (${vId2}, 'BENEFIT', 11160.00, 'Acompte ventes boutique Fashion Plus', 'VENTES', 'VALIDATED')
          ON CONFLICT DO NOTHING;
        `);
      }

      // 8. Seed Product Reviews
      const prPhone = prodMap['smartphone-pro-max'];
      if (prPhone && custId) {
        await client.query(`
          INSERT INTO product_reviews (product_id, user_id, rating, comment, is_verified_purchase, status)
          VALUES (${prPhone.id}, ${custId}, 5, 'Excellent smartphone ! Livraison rapide en 24h à Blida.', TRUE, 'APPROVED')
          ON CONFLICT DO NOTHING;
        `);
      }

      // 9. Seed Ad Banners
      await client.query(`
        INSERT INTO ads_banners (title, image_url, target_url, position, priority, is_active) VALUES
        ('Promotions High-Tech MBA 2025', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da', '/catalog?category=electronique', 'HOME_HEADER', 1, TRUE),
        ('Nouvelle Collection Mode Algérie', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8', '/catalog?category=vetements', 'HOME_HEADER', 2, TRUE)
        ON CONFLICT DO NOTHING;
      `);

      // 10. Seed Delivery Companies
      await client.query(`
        INSERT INTO delivery_companies (name, phone, email, status) VALUES
        ('Yalidine Express', '+213 982 00 00 00', 'contact@yalidine.com', 'ACTIVE'),
        ('ZR Express Algérie', '+213 982 11 11 11', 'contact@zrexpress.dz', 'ACTIVE'),
        ('Kazi Tour Logistics', '+213 982 22 22 22', 'support@kazitour.dz', 'ACTIVE')
        ON CONFLICT DO NOTHING;
      `);

      // 11. Seed CMS Pages
      await client.query(`
        INSERT INTO pages (title, slug, content) VALUES
        ('À propos', 'a-propos', 'Bienvenue sur MBA - Ma Boutique Algérienne. Notre plateforme offre une solution complète pour les acheteurs et vendeurs algériens.'),
        ('Mentions Légales', 'mentions-legales', 'Éditeur du site : Web Manager Inc. Hébergement local et conteneurisé.'),
        ('Politique de Livraison', 'politique-livraison', 'Livraison disponible dans l ensemble des 58 Wilayas d Algérie avec option Cash on Delivery (COD).')
        ON CONFLICT (slug) DO NOTHING;
      `);

      // 12. Seed Platform Settings
      const defaultSettings = [
        ['support_email', 'support@webmanager.local'],
        ['support_phone', '+213 21 00 00 00'],
        ['support_hours', 'Samedi - Jeudi : 08h30 - 18h00'],
        ['facebook_url', 'https://facebook.com/maboutiquealgerienne'],
        ['instagram_url', 'https://instagram.com/maboutiquealgerienne'],
        ['tiktok_url', 'https://tiktok.com/@maboutiquealgerienne']
      ];

      for (const [sKey, sVal] of defaultSettings) {
        await client.query(`
          INSERT INTO platform_settings (key, value)
          VALUES ('${sKey}', '${sVal}')
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
        `);
      }

      console.log('Database seeded successfully.');

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
