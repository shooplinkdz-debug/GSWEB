import request from 'supertest';
import app from './index';

describe('API Architecture & Contract Tests', () => {
  it('GET /api/health returns proper health structure and 200 status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'WebManager API');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/non-existent-route returns 404 status code', async () => {
    const res = await request(app).get('/api/non-existent-route');
    expect(res.status).toBe(404);
  });

  it('POST /api/auth/login without credentials returns 400 validation error', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /api/orders without body returns 401 unauthorized or 400 error', async () => {
    const res = await request(app).post('/api/orders').send({});
    expect([400, 401]).toContain(res.status);
  });
});
