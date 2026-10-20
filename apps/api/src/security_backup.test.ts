import pool from './db';

jest.mock('./db', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from './index';

const mockedPool = pool as jest.Mocked<typeof pool>;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_12345';

describe('Mission 16: Security, Activity Logs & DB Backup/Restore API', () => {
  const adminToken = jwt.sign({ id: 1, email: 'admin@webmanager.local', role: 'ADMIN' }, JWT_SECRET);
  const managerToken = jwt.sign({ id: 2, email: 'manager@webmanager.local', role: 'MANAGER' }, JWT_SECRET);
  const customerToken = jwt.sign({ id: 3, email: 'customer@webmanager.local', role: 'CUSTOMER' }, JWT_SECRET);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/logs', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/admin/logs');
      expect(res.status).toBe(401);
    });

    it('should return 403 for CUSTOMER role', async () => {
      const res = await request(app)
        .get('/api/admin/logs')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('should return activity logs for ADMIN', async () => {
      const sampleLogs = [
        { id: 1, user_id: 1, action: 'USER_LOGIN', details: '{"email":"admin@webmanager.local"}', ip_address: '127.0.0.1', created_at: new Date().toISOString(), user_email: 'admin@webmanager.local' },
      ];
      (mockedPool.query as jest.Mock).mockResolvedValueOnce({ rows: sampleLogs });

      const res = await request(app)
        .get('/api/admin/logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].action).toBe('USER_LOGIN');
    });
  });

  describe('POST /api/admin/backup', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).post('/api/admin/backup');
      expect(res.status).toBe(401);
    });

    it('should return 403 for MANAGER role', async () => {
      const res = await request(app)
        .post('/api/admin/backup')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.status).toBe(403);
    });

    it('should return backup snapshot for ADMIN', async () => {
      (mockedPool.query as jest.Mock)
        .mockResolvedValue({ rows: [] }); // tables query & log insert

      const res = await request(app)
        .post('/api/admin/backup')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('users');
      expect(res.body.data).toHaveProperty('products');
    });
  });

  describe('POST /api/admin/restore', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).post('/api/admin/restore').send({ data: {} });
      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid backup payload', async () => {
      const res = await request(app)
        .post('/api/admin/restore')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should restore database payload for ADMIN', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn(),
      };
      (mockedPool.connect as jest.Mock).mockResolvedValueOnce(mockClient);

      const backupPayload = {
        data: {
          users: [{ id: 10, email: 'restored@local.test', password_hash: 'hash', role: 'CUSTOMER' }],
          pages: [{ id: 5, title: 'Restored Page', slug: 'restored-page', content: 'Test' }],
        },
      };

      const res = await request(app)
        .post('/api/admin/restore')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(backupPayload);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Base de données restaurée avec succès.');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });
  });
});
