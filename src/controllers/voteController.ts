import { Response } from 'express';
import { db } from '../config/db';
import { votes, users, candidates } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { AuthRequest } from '../middleware/authMiddleware';
import { Request } from 'express';

import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 30 }); // 30 seconds cache

export const vote = async (req: AuthRequest, res: Response) => {
     const { candidateId } = req.body;
     const userId = req.user.id;

     if (!candidateId) {
          return res.status(400).json({ message: 'Candidate ID is required' });
     }

     try {
          // Transaction
          await db.transaction(async (tx) => {
               // Check if user has voted
               const userCheck = await tx.select({ hasVoted: users.hasVoted }).from(users).where(eq(users.id, userId));
               if (userCheck[0].hasVoted) {
                    throw new Error('User has already voted'); // Breaks transaction
               }

               // Insert vote
               await tx.insert(votes).values({
                    voterId: userId,
                    candidateId: candidateId
               });

               // Update user
               await tx.update(users).set({ hasVoted: true }).where(eq(users.id, userId));
          });

          // Invalidate cache immediately after a vote (optional, but good for accuracy)
          // or just let it expire. Let's expire it to show real-time progress better.
          cache.del("stats");
          cache.del("results");

          res.json({ message: 'Vote cast successfully' });
     } catch (error: any) {
          console.error('Vote error:', error);
          if (error.message === 'User has already voted') {
               return res.status(400).json({ message: error.message });
          }
          res.status(500).json({ message: 'Error casting vote' });
     }
};

export const getVoteStatus = async (req: AuthRequest, res: Response) => {
     const userId = req.user.id;
     try {
          const result = await db.select({ hasVoted: users.hasVoted }).from(users).where(eq(users.id, userId));
          res.json({ hasVoted: result[0]?.hasVoted || false });
     } catch (error) {
          res.status(500).json({ message: 'Error checking status' });
     }
}

export const getStats = async (req: Request, res: Response) => {
     try {
          const cached = cache.get("stats");
          if (cached) return res.json(cached);

          const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
          const voteCount = await db.select({ count: sql<number>`count(*)` }).from(votes);

          const totalVoters = Number(userCount[0].count);
          const votesCast = Number(voteCount[0].count);
          const turnout = totalVoters > 0 ? ((votesCast / totalVoters) * 100).toFixed(2) + "%" : "0%";

          const data = {
               totalVoters,
               votesCast,
               turnout
          };

          cache.set("stats", data);
          res.json(data);
     } catch (error) {
          console.error("Stats Error", error);
          res.status(500).json({ message: 'Error fetching stats' });
     }
}

export const getResults = async (req: Request, res: Response) => {
     try {
          const cached = cache.get("results");
          if (cached) return res.json(cached);

          // Group by candidate and count
          const results = await db.select({
               candidateId: votes.candidateId,
               count: sql<number>`count(*)`
          }).from(votes).groupBy(votes.candidateId);

          // Fetch candidates to map names (or do a join)
          const candidatesData = await db.select().from(candidates);

          // Map results to candidates
          const finalResults = candidatesData.map(c => {
               const found = results.find(r => r.candidateId === c.id);
               return {
                    id: c.id,
                    name: c.name,
                    votes: Number(found?.count || 0),
                    fill: c.orderNumber === 1 ? "#3b82f6" : "#ef4444" // Simply color logic
               };
          });

          cache.set("results", finalResults);
          res.json(finalResults);
     } catch (error) {
          console.error("Results Error", error);
          res.status(500).json({ message: 'Error fetching results' });
     }
}
