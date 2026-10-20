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
  const vendorToken = jwt.sign({ id: 4, email: 'vendor@techstore.local', role: 'VENDOR' }, JWT_SECRET);
  const customerToken = jwt.sign({ id: 3, email: 'customer@webmanager.local', role: 'CUSTOMER' }, JWT_SECRET);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/vendors should return list of approved vendors', async () => {
    (mockedPool.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        { id: 1, user_id: 4, company_name: 'TechStore Direct', slug: 'techstore-direct', status: 'APPROVED' },
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
        rows: [{ id: 2, user_id: 3, company_name: 'My New Store', slug: 'my-new-store', status: 'APPROVED' }],
      }) // Insert vendor
      .mockResolvedValueOnce({ rows: [] }) // Role update
      .mockResolvedValueOnce({ rows: [] }); // Activity log

    const res = await request(app)
      .post('/api/vendors')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ company_name: 'My New Store', slug: 'my-new-store' });

    expect(res.status).toBe(201);
    expect(res.body.company_name).toBe('My New Store');
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

  it('POST /api/vendors/me/products creates vendor product', async () => {
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
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Vendor lookup
      .mockResolvedValueOnce({ rows: [newProd] }) // Product insert
      .mockResolvedValueOnce({ rows: [] }); // Activity log

    const res = await request(app)
      .post('/api/vendors/me/products')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ sku: 'VEND-100', name: 'Souris Gamer', slug: 'souris-gamer', price: 59.99, stock: 20 });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Souris Gamer');
  });
});
