import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Rate Limiter: 5 messages per 10 seconds per IP
const rateLimiter = new RateLimiterMemory({
     points: 5,
     duration: 10,
});

export interface AuthenticatedSocket extends Socket {
     user?: any;
}

export const socketAuth = async (socket: AuthenticatedSocket, next: (err?: any) => void) => {
     try {
          // Check for Admin Token
          const token = socket.handshake.auth.token;

          if (token) {
               try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
                    socket.user = decoded;
               } catch (err) {
                    // Invalid token, but we might allow guest/student access without 'admin' privileges
                    // For now, if a token is provided but invalid, we log it but don't block connection entirely 
                    // unless we want strict auth. 
                    // Better approach: If token invalid, treat as guest.
               }
          }

          next();
     } catch (err) {
          next(new Error('Authentication failed'));
     }
};

export const checkRateLimit = async (socket: Socket) => {
     try {
          await rateLimiter.consume(socket.handshake.address);
          return true;
     } catch (rej) {
          return false;
     }
};
