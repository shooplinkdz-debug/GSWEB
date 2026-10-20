import request from 'supertest';
import app from './index';

describe('Mission 08: API Server & Error Handling', () => {
  it('GET /api/health returns 200 OK with service info', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'WebManager API');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/non-existent-route returns 404 with standard error message', async () => {
    const res = await request(app).get('/api/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Ressource introuvable' });
  });

  it('POST /api/auth/register with invalid JSON body handles bad request correctly', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
