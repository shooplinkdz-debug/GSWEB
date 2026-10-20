import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from './index';
import { authenticateToken, requireRole, AuthRequest } from './middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_12345';

describe('Mission 09: Authentification, Rôles et Permissions (RBAC)', () => {
  describe('auth middleware (authenticateToken & requireRole)', () => {
    let req: Partial<AuthRequest>;
    let res: any;
    let next: jest.Mock;

    beforeEach(() => {
      req = { headers: {} };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      next = jest.fn();
    });

    it('authenticateToken should return 401 if token is missing', () => {
      authenticateToken(req as AuthRequest, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Accès non autorisé : jeton absent.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('authenticateToken should return 403 if token is invalid', () => {
      req.headers = { authorization: 'Bearer invalid_token_xyz' };
      authenticateToken(req as AuthRequest, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Jeton invalide ou expiré.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('authenticateToken should decode valid JWT token and call next()', () => {
      const payload = { id: 1, email: 'admin@webmanager.local', role: 'ADMIN' as const };
      const token = jwt.sign(payload, JWT_SECRET);
      req.headers = { authorization: `Bearer ${token}` };

      authenticateToken(req as AuthRequest, res, next);

      expect(req.user).toBeDefined();
      expect(req.user?.id).toBe(1);
      expect(req.user?.role).toBe('ADMIN');
      expect(next).toHaveBeenCalled();
    });

    it('requireRole should return 401 if req.user is missing', () => {
      const middleware = requireRole(['ADMIN']);
      middleware(req as AuthRequest, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Non authentifié.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('requireRole should return 403 if user role is not allowed', () => {
      req.user = { id: 2, email: 'customer@webmanager.local', role: 'CUSTOMER' };
      const middleware = requireRole(['ADMIN', 'MANAGER']);
      middleware(req as AuthRequest, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Permission insuffisante.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('requireRole should call next() if user role is in allowed roles', () => {
      req.user = { id: 3, email: 'manager@webmanager.local', role: 'MANAGER' };
      const middleware = requireRole(['ADMIN', 'MANAGER']);
      middleware(req as AuthRequest, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Auth Endpoints & Protection Matrix', () => {
    it('GET /api/auth/me without token should return 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Accès non autorisé : jeton absent.' });
    });

    it('GET /api/auth (User list) with CUSTOMER token should return 403 Forbidden', async () => {
      const customerToken = jwt.sign(
        { id: 99, email: 'customer@test.com', role: 'CUSTOMER' },
        JWT_SECRET
      );

      const res = await request(app)
        .get('/api/auth')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Permission insuffisante.' });
    });

    it('POST /api/auth/login with missing email should return 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Email et mot de passe requis.' });
    });

    it('POST /api/auth/register with missing fields should return 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'newuser@test.com' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Email et mot de passe requis.' });
    });
  });
});
