import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me';

export const login = async (req: Request, res: Response) => {
     const { nim, password } = req.body;

     if (!nim || !password) {
          return res.status(400).json({ message: 'NIM and password are required' });
     }

     try {
          const userResult = await db.select().from(users).where(eq(users.nim, nim));
          const user = userResult[0];

          if (!user) {
               return res.status(401).json({ message: 'Invalid credentials' });
          }

          const validPassword = await bcrypt.compare(password, user.passwordHash);
          if (!validPassword) {
               return res.status(401).json({ message: 'Invalid credentials' });
          }

          const token = jwt.sign(
               { id: user.id, nim: user.nim, role: user.role },
               JWT_SECRET,
               { expiresIn: '1h' }
          );

          res.json({ token, user: { id: user.id, nim: user.nim, role: user.role, has_voted: user.hasVoted } });
     } catch (error) {
          console.error('Login error:', error);
          res.status(500).json({ message: 'Internal server error' });
     }
};

export const register = async (req: Request, res: Response) => {
     // Basic register for testing purposes
     const { nim, password, role } = req.body;
     try {
          const hashedPassword = await bcrypt.hash(password, 10);
          const result = await db.insert(users).values({
               nim,
               passwordHash: hashedPassword,
               role: role || 'voter'
          }).returning({ id: users.id, nim: users.nim });

          res.status(201).json(result[0]);
     } catch (error) {
          console.error('Register error:', error);
          res.status(500).json({ message: 'Error registering user' });
     }
}
