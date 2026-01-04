import { Request, Response } from 'express';
import { db } from '../config/db';
import { chatSessions, users } from '../db/schema';
import { desc, eq, sql, and } from 'drizzle-orm';

export const getChatSessions = async (req: Request, res: Response) => {
     try {
          const sessions = await db.query.chatSessions.findMany({
               where: eq(chatSessions.status, 'open'),
               with: {
                    student: {
                         columns: {
                              name: true,
                              email: true,
                              nim: true
                         }
                    }
               },
               orderBy: [desc(chatSessions.lastMessageAt)]
          });
          res.json(sessions);
     } catch (error) {
          console.error('Error fetching chat sessions:', error);
          res.status(500).json({ message: 'Internal server error' });
     }
};


export const updateSessionStatus = async (req: Request, res: Response) => {
     const { id } = req.params;
     const { status } = req.body; // 'open', 'closed', 'archived'

     try {
          await db.update(chatSessions)
               .set({ status })
               .where(eq(chatSessions.id, id));

          // Notify the session room that it has been ended/archived
          if (status === 'archived' || status === 'closed') {
               const io = req.app.get('io');
               io?.to(id).emit('session_ended');
          }

          res.sendStatus(200);
     } catch (error) {
          console.error('Error updating session status:', error);
          res.status(500).json({ message: 'Internal server error' });
     }
};

export const getChatStats = async (req: Request, res: Response) => {
     try {
          const openSessions = await db.select({ count: sql<number>`count(*)` })
               .from(chatSessions)
               .where(
                    and(
                         eq(chatSessions.status, 'open'),
                         eq(chatSessions.lastMessageBy, 'student')
                    )
               );

          res.json({ openCount: Number(openSessions[0].count) });
     } catch (error) {
          console.error('Error fetching chat stats:', error);
          res.status(500).json({ message: 'Internal server error' });
     }
};
