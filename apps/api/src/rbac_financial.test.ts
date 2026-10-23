import pool from './db';

jest.mock('./db', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

import request from 'supertest';
import app from './index';

const mockedPool = pool as jest.Mocked<typeof pool>;

describe('RBAC & Financial Ledger API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/health should return ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/ads should return public active banners array', async () => {
    (mockedPool.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        { id: 1, title: 'Bannière Promo', image_url: 'http://example.com/banner.jpg', is_active: true },
      ],
    });

    const res = await request(app).get('/api/ads');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('Bannière Promo');
  });

  it('GET /api/delivery/companies should return delivery companies array', async () => {
    (mockedPool.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        { id: 1, name: 'Yalidine Express', status: 'ACTIVE' },
      ],
    });

    const res = await request(app).get('/api/delivery/companies');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe('Yalidine Express');
  });

  it('GET /api/settings should return public platform settings object', async () => {
    (mockedPool.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        { key: 'support_email', value: 'support@maboutiquealgerienne.dz' },
        { key: 'support_phone', value: '+213 (0) 23 45 67 89' },
      ],
    });

    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('support_email', 'support@maboutiquealgerienne.dz');
    expect(res.body).toHaveProperty('support_phone', '+213 (0) 23 45 67 89');
  });
});
