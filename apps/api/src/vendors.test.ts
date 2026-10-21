import pool from './db';

jest.mock('./db', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from './index';

const mockedPool = pool as jest.Mocked<typeof pool>;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_12345';

describe('Multi-Vendor API Integration Tests', () => {
  const adminToken = jwt.sign({ id: 1, email: 'admin@webmanager.local', role: 'ADMIN' }, JWT_SECRET);
  const vendorToken = jwt.sign({ id: 4, email: 'vendor@techstore.local', role: 'VENDOR' }, JWT_SECRET);
  const customerToken = jwt.sign({ id: 3, email: 'customer@webmanager.local', role: 'CUSTOMER' }, JWT_SECRET);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/vendors should return list of approved vendors', async () => {
    (mockedPool.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        { id: 1, user_id: 4, company_name: 'TechStore Direct', slug: 'techstore-direct', status: 'APPROVED', phone: '0550000000', wilaya: 'Alger' },
      ],
    });

    const res = await request(app).get('/api/vendors');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].company_name).toBe('TechStore Direct');
  });

  it('GET /api/vendors/:slug for existing vendor returns vendor details and products', async () => {
    (mockedPool.query as jest.Mock)
      .mockResolvedValueOnce({
        rows: [{ id: 1, company_name: 'TechStore Direct', slug: 'techstore-direct', status: 'APPROVED' }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 10, name: 'Clavier Mécanique', price: 89.99, vendor_id: 1 }],
      });

    const res = await request(app).get('/api/vendors/techstore-direct');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('vendor');
    expect(res.body).toHaveProperty('products');
    expect(res.body.vendor.company_name).toBe('TechStore Direct');
    expect(res.body.products.length).toBe(1);
  });

  it('GET /api/vendors/:slug for non-existent vendor returns 404', async () => {
    (mockedPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/vendors/unknown-vendor');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Vendeur introuvable.');
  });

  it('POST /api/vendors without authentication returns 401', async () => {
    const res = await request(app)
      .post('/api/vendors')
      .send({ company_name: 'New Shop', slug: 'new-shop' });

    expect(res.status).toBe(401);
  });

  it('POST /api/vendors with authenticated CUSTOMER creates vendor profile', async () => {
    (mockedPool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [] }) // No existing vendor/slug
      .mockResolvedValueOnce({
        rows: [{ id: 2, user_id: 3, company_name: 'My New Store', slug: 'my-new-store', status: 'APPROVED', phone: '0661000000', wilaya: 'Oran' }],
      }) // Insert vendor
      .mockResolvedValueOnce({ rows: [] }) // Role update
      .mockResolvedValueOnce({ rows: [] }); // Activity log

    const res = await request(app)
      .post('/api/vendors')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ company_name: 'My New Store', slug: 'my-new-store', phone: '0661000000', wilaya: 'Oran' });

    expect(res.status).toBe(201);
    expect(res.body.company_name).toBe('My New Store');
  });

  it('PUT /api/vendors/me updates vendor store profile (phone, wilaya, logo, description)', async () => {
    (mockedPool.query as jest.Mock)
      .mockResolvedValueOnce({
        rows: [{ id: 1, user_id: 4, company_name: 'TechStore', slug: 'techstore', description: 'Old desc', logo_url: '', phone: '0550', wilaya: 'Alger' }],
      }) // Fetch existing vendor
      .mockResolvedValueOnce({ rows: [] }) // Slug check (no duplicate found)
      .mockResolvedValueOnce({
        rows: [{ id: 1, user_id: 4, company_name: 'TechStore Pro', slug: 'techstore-pro', description: 'New desc', logo_url: 'logo.png', phone: '0555123456', wilaya: 'Blida' }],
      }) // Update query
      .mockResolvedValueOnce({ rows: [] }); // Activity log

    const res = await request(app)
      .put('/api/vendors/me')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        store_name: 'TechStore Pro',
        slug: 'techstore-pro',
        description: 'New desc',
        logo: 'logo.png',
        phone: '0555123456',
        wilaya: 'Blida',
      });

    expect(res.status).toBe(200);
    expect(res.body.company_name).toBe('TechStore Pro');
    expect(res.body.phone).toBe('0555123456');
    expect(res.body.wilaya).toBe('Blida');
  });

  it('PUT /api/vendors/:id/status allows ADMIN to update vendor approval status', async () => {
    (mockedPool.query as jest.Mock)
      .mockResolvedValueOnce({
        rows: [{ id: 2, company_name: 'Pending Store', status: 'APPROVED' }],
      }) // Update status
      .mockResolvedValueOnce({ rows: [] }); // Activity log

    const res = await request(app)
      .put('/api/vendors/2/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'APPROVED' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('APPROVED');
  });

  it('GET /api/vendors/me/stats with VENDOR token returns stats', async () => {
    (mockedPool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Vendor ID
      .mockResolvedValueOnce({ rows: [{ count: '5' }] }) // Products count
      .mockResolvedValueOnce({ rows: [{ count: '1' }] }) // Low stock count
      .mockResolvedValueOnce({ rows: [{ total_orders: '3', total_revenue: '450.00' }] }); // Sales

    const res = await request(app)
      .get('/api/vendors/me/stats')
      .set('Authorization', `Bearer ${vendorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalProducts).toBe(5);
    expect(res.body.lowStockProducts).toBe(1);
    expect(res.body.totalOrders).toBe(3);
    expect(res.body.totalRevenue).toBe(450);
  });

  it('POST /api/vendors/me/products creates vendor product for approved vendor', async () => {
    const newProd = {
      id: 20,
      vendor_id: 1,
      sku: 'VEND-100',
      name: 'Souris Gamer',
      slug: 'souris-gamer',
      price: 59.99,
      stock: 20,
    };

    (mockedPool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ id: 1, status: 'APPROVED' }] }) // Vendor lookup with status
      .mockResolvedValueOnce({ rows: [newProd] }) // Product insert
      .mockResolvedValueOnce({ rows: [] }); // Activity log

    const res = await request(app)
      .post('/api/vendors/me/products')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ sku: 'VEND-100', name: 'Souris Gamer', slug: 'souris-gamer', price: 59.99, stock: 20 });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Souris Gamer');
  });

  it('POST /api/vendors/me/products rejects product creation for non-approved vendor', async () => {
    (mockedPool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ id: 1, status: 'PENDING' }] }); // Vendor lookup with status PENDING

    const res = await request(app)
      .post('/api/vendors/me/products')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ sku: 'VEND-101', name: 'Ecran 4K', slug: 'ecran-4k', price: 299.99 });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Seules les boutiques approuvées peuvent publier des produits.');
  });

  it('GET /api/vendors/admin/all returns list of all vendors for ADMIN', async () => {
    (mockedPool.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        { id: 1, company_name: 'Store 1', status: 'APPROVED' },
        { id: 2, company_name: 'Store 2', status: 'PENDING' },
      ],
    });

    const res = await request(app)
      .get('/api/vendors/admin/all')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });
});
