import pool from './db';

// Mock the pg pool query method for offline/unit tests
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

describe('Mission 12: CMS & Content Management API', () => {
  const adminToken = jwt.sign({ id: 1, email: 'admin@webmanager.local', role: 'ADMIN' }, JWT_SECRET);
  const managerToken = jwt.sign({ id: 2, email: 'manager@webmanager.local', role: 'MANAGER' }, JWT_SECRET);
  const customerToken = jwt.sign({ id: 3, email: 'customer@webmanager.local', role: 'CUSTOMER' }, JWT_SECRET);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/pages should return array of pages', async () => {
    (mockedPool.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        { id: 1, title: 'À propos', slug: 'a-propos', content: 'Contenu', is_published: true },
      ],
    });

    const res = await request(app).get('/api/pages');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].slug).toBe('a-propos');
  });

  it('GET /api/pages/:slug for non-existent page should return 404', async () => {
    (mockedPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/pages/non-existent-slug-xyz');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Page introuvable.');
  });

  it('POST /api/pages without auth should return 401', async () => {
    const res = await request(app)
      .post('/api/pages')
      .send({ title: 'Test', slug: 'test-page', content: 'Some content' });
    expect(res.status).toBe(401);
  });

  it('POST /api/pages with CUSTOMER role should return 403', async () => {
    const res = await request(app)
      .post('/api/pages')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ title: 'Test', slug: 'test-page', content: 'Some content' });
    expect(res.status).toBe(403);
  });

  it('POST /api/pages with missing required fields should return 400', async () => {
    const res = await request(app)
      .post('/api/pages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Missing Slug and Content' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /api/pages with ADMIN token and valid payload should create page', async () => {
    const newPage = { id: 3, title: 'FAQ', slug: 'faq', content: 'Questions fréquentes', is_published: true };
    (mockedPool.query as jest.Mock).mockResolvedValueOnce({ rows: [newPage] });

    const res = await request(app)
      .post('/api/pages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'FAQ', slug: 'faq', content: 'Questions fréquentes', is_published: true });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(newPage);
  });

  it('DELETE /api/pages/:id with MANAGER role should return 403 (ADMIN only)', async () => {
    const res = await request(app)
      .delete('/api/pages/999')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res.status).toBe(403);
  });

  it('DELETE /api/pages/:id with ADMIN role should delete page', async () => {
    (mockedPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const res = await request(app)
      .delete('/api/pages/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Page supprimée avec succès.' });
  });
});
