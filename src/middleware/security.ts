import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Express } from 'express';

export const configureSecurity = (app: Express) => {
     // Safe HTTP headers
     app.use(helmet());

     // Rate limiting to prevent brute force
     const limiter = rateLimit({
          windowMs: 15 * 60 * 1000, // 15 minutes
          limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
          standardHeaders: true,
          legacyHeaders: false,
          message: 'Too many requests from this IP, please try again after 15 minutes',
     });

     // Apply rate limiting to all requests (or you can apply it only to auth routes)
     app.use(limiter);
};
