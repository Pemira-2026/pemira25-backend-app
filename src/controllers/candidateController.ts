import { Request, Response } from 'express';
import { db } from '../config/db';
import { candidates, votes, users } from '../db/schema';
import { asc, eq, inArray, isNull } from 'drizzle-orm';

export const getCandidates = async (req: Request, res: Response) => {
     try {
          const result = await db.select().from(candidates)
               .where(isNull(candidates.deletedAt)) // Filter soft-deleted
               .orderBy(asc(candidates.orderNumber));
          res.json(result);
     } catch (error) {
          console.error('Error fetching candidates:', error);
          res.status(500).json({ message: 'Internal server error' });
     }
};

export const createCandidate = async (req: Request, res: Response) => {
     const { name, vision, mission, orderNumber, photoUrl } = req.body;

     try {
          await db.insert(candidates).values({
               name,
               vision,
               mission,
               orderNumber: Number(orderNumber),
               photoUrl
          });
          res.status(201).json({ message: 'Candidate created successfully' });
     } catch (error) {
          console.error('Create candidate error:', error);
          res.status(500).json({ message: 'Failed to create candidate' });
     }
};

export const updateCandidate = async (req: Request, res: Response) => {
     const { id } = req.params;
     const { name, vision, mission, orderNumber, photoUrl } = req.body;

     try {
          await db.update(candidates)
               .set({ name, vision, mission, orderNumber: Number(orderNumber), photoUrl })
               .where(eq(candidates.id, id));
          res.json({ message: 'Candidate updated successfully' });
     } catch (error) {
          console.error('Update candidate error:', error);
          res.status(500).json({ message: 'Failed to update candidate' });
     }
};

export const deleteCandidate = async (req: Request, res: Response) => {
     const { id } = req.params;
     try {
          // Soft Delete: Mark as deleted to allow recovery/safety
          await db.update(candidates)
               .set({ deletedAt: new Date() })
               .where(eq(candidates.id, id));

          res.json({ message: 'Candidate deleted (Soft)' });
     } catch (error) {
          console.error('Delete candidate error:', error);
          res.status(500).json({ message: 'Failed to delete candidate' });
     }
};
