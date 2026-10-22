import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type RoleType = 'ADMIN' | 'MANAGER' | 'CUSTOMER' | 'VENDOR' | 'DEVELOPER' | 'CONFIRMATEUR';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: RoleType;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_12345';

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Accès non autorisé : jeton absent.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest['user'];
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Jeton invalide ou expiré.' });
  }
}

export function requireRole(allowedRoles: Array<RoleType>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission insuffisante.' });
    }

    next();
  };
}
