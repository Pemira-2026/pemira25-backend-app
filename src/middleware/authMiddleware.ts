import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ea9dd5af6befb4b8b1b9d17d75f0f5afea1f3bde012cc1fa58cc5f926ab355e121ddb710eaaf6684e309d6f906946d8985b8a1ad5be14efc62e2029a9a5f50b0';

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
          // Allow 'super_admin' and 'panitia' to access admin routes
          const allowedRoles = ['super_admin', 'panitia'];

          if (allowedRoles.includes(req.user?.role)) {
               next();
          } else {
               res.sendStatus(403);
          }
     });
};
