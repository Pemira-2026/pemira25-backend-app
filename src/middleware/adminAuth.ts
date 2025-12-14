import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me';

export interface AdminAuthRequest extends Request {
     user?: any;
}

export const authenticateAdmin = (req: AdminAuthRequest, res: Response, next: NextFunction) => {
     let token = req.cookies.admin_token;

     if (!token) {
          const authHeader = req.headers['authorization'];
          if (authHeader && authHeader.startsWith('Bearer ')) {
               token = authHeader.split(' ')[1];
          }
     }

     if (!token) {
          return res.status(401).json({ error: 'Unauthorized: No token provided' });
     }

     jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
          if (err) {
               return res.status(403).json({ error: 'Forbidden: Invalid token' });
          }

          // Role Check
          if (decoded.role === 'voter') {
               return res.status(403).json({ error: 'Forbidden: Voters cannot access admin area' });
          }

          req.user = decoded;
          next();
     });
};

export const requireSuperAdmin = (req: AdminAuthRequest, res: Response, next: NextFunction) => {
     const role = req.user?.role;
     if (role !== 'super_admin') {
          return res.status(403).json({ error: 'Forbidden: Requires Super Admin' });
     }
     next();
};
