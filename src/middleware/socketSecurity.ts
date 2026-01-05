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
                    // Invalid token - treat as guest
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
