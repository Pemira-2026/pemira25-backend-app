import { Request, Response } from 'express';
import { db } from '../config/db';
import { candidates } from '../db/schema';
import { asc } from 'drizzle-orm';

export const getCandidates = async (req: Request, res: Response) => {
     try {
          const result = await db.select().from(candidates).orderBy(asc(candidates.orderNumber));
          res.json(result);
     } catch (error) {
          console.error('Error fetching candidates:', error);
          res.status(500).json({ message: 'Internal server error' });
     }
};
