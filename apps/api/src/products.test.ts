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

describe('Mission 13: Product Catalog & Stock Management API', () => {
  const adminToken = jwt.sign({ id: 1, email: 'admin@webmanager.local', role: 'ADMIN' }, JWT_SECRET);
  const managerToken = jwt.sign({ id: 2, email: 'manager@webmanager.local', role: 'MANAGER' }, JWT_SECRET);
  const customerToken = jwt.sign({ id: 3, email: 'customer@webmanager.local', role: 'CUSTOMER' }, JWT_SECRET);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/products should return list of products', async () => {
    (mockedPool.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        { id: 1, sku: 'ELEC-001', name: 'Smartphone Pro Max', price: 999.99, stock: 15, low_stock_threshold: 3 },
      ],
    });

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].sku).toBe('ELEC-001');
  });

  it('GET /api/products/:slug for non-existent product should return 404', async () => {
    (mockedPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/products/non-existent-product-slug');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Produit introuvable.');
  });

  it('POST /api/products without token should return 401', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ sku: 'TEST-001', name: 'Test', slug: 'test-product', price: 10 });
    expect(res.status).toBe(401);
  });

  it('POST /api/products with CUSTOMER token should return 403', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ sku: 'TEST-001', name: 'Test', slug: 'test-product', price: 10 });
    expect(res.status).toBe(403);
  });

  it('POST /api/products with missing required fields should return 400', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Incomplete Product' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /api/products with MANAGER token and valid body should create product', async () => {
    const newProduct = {
      id: 5,
      sku: 'CAM-001',
      name: 'Caméra HD',
      slug: 'camera-hd',
      price: 150,
      stock: 10,
      low_stock_threshold: 2,
    };
    (mockedPool.query as jest.Mock).mockResolvedValueOnce({ rows: [newProduct] });

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ sku: 'CAM-001', name: 'Caméra HD', slug: 'camera-hd', price: 150, stock: 10, low_stock_threshold: 2 });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(newProduct);
  });

  it('DELETE /api/products/:id with MANAGER token should return 403 (ADMIN only)', async () => {
    const res = await request(app)
      .delete('/api/products/999')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res.status).toBe(403);
  });

  it('DELETE /api/products/:id with ADMIN token should delete product', async () => {
    (mockedPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const res = await request(app)
      .delete('/api/products/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Produit supprimé avec succès.' });
  });
});
