import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me';

export interface AuthRequest extends Request {
     user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
     const authHeader = req.headers['authorization'];
     const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

     if (token == null) return res.sendStatus(401);

     jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
          if (err) return res.sendStatus(403);
          req.user = user;
          next();
     });
};

export const authenticateAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
     authenticateToken(req, res, () => {
          // Allow 'admin', 'super_admin', and 'panitia' to access admin routes
          const allowedRoles = ['admin', 'super_admin', 'panitia'];

          console.log('[AuthDebug] User:', req.user); // Debug log

          if (allowedRoles.includes(req.user?.role)) {
               next();
          } else {
               console.log('[AuthDebug] Access Denied. Role:', req.user?.role); // Debug log
               res.sendStatus(403);
          }
     });
};
