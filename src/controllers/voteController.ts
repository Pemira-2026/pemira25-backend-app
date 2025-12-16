import { Response } from 'express';
import { db } from '../config/db';
import { votes, users, candidates } from '../db/schema';
import { eq, sql, and } from 'drizzle-orm';
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
          // Transaction to ensure atomicity
          await db.transaction(async (tx) => {
               // 1. Check if user has voted
               const userCheck = await tx.select({ hasVoted: users.hasVoted }).from(users).where(eq(users.id, userId));
               if (userCheck[0].hasVoted) {
                    throw new Error('User has already voted');
               }

               // 2. Insert ANONYMOUS vote (No voterId)
               await tx.insert(votes).values({
                    candidateId: candidateId,
                    source: 'online'
               });

               // 3. Mark user as voted and timestamp matches logic
               await tx.update(users)
                    .set({ hasVoted: true, votedAt: new Date() })
                    .where(eq(users.id, userId));
          });

          // Invalidate cache
          cache.del("stats");
          cache.del("results");
          cache.del("recent-activity"); // assuming dynamic key or just let it expire

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

          const onlineCount = await db.select({ count: sql<number>`count(*)` }).from(votes).where(eq(votes.source, 'online'));
          const offlineCount = await db.select({ count: sql<number>`count(*)` }).from(votes).where(eq(votes.source, 'offline'));

          const totalVoters = Number(userCount[0].count);
          const votesCast = Number(voteCount[0].count);
          const turnout = totalVoters > 0 ? ((votesCast / totalVoters) * 100).toFixed(2) + "%" : "0%";

          const data = {
               totalVoters,
               votesCast,
               turnout,
               onlineVotes: Number(onlineCount[0].count),
               offlineVotes: Number(offlineCount[0].count)
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

          // Group by candidate and source
          const results = await db.select({
               candidateId: votes.candidateId,
               source: votes.source,
               count: sql<number>`count(*)`
          })
               .from(votes)
               .groupBy(votes.candidateId, votes.source);

          // Fetch candidates to map names
          const candidatesData = await db.select().from(candidates);

          // Map results to candidates
          const finalResults = candidatesData.map(c => {
               const onlineCount = results.find(r => r.candidateId === c.id && r.source === 'online')?.count || 0;
               const offlineCount = results.find(r => r.candidateId === c.id && r.source === 'offline')?.count || 0;

               return {
                    id: c.id,
                    name: c.name,
                    orderNumber: c.orderNumber,
                    onlineVotes: Number(onlineCount),
                    offlineVotes: Number(offlineCount),
                    votes: Number(onlineCount) + Number(offlineCount),
                    fill: c.orderNumber === 1 ? "#3b82f6" : "#ef4444"
               };
          });

          cache.set("results", finalResults);
          res.json(finalResults);
     } catch (error) {
          console.error("Results Error", error);
          res.status(500).json({ message: 'Error fetching results' });
     }
}

export const manualVote = async (req: Request, res: Response) => {
     const { candidateId } = req.body;

     // NO NIM required for offline tally (per user request).
     // This function is purely for "Ballot Box Stuffing" (Tallying paper votes).
     // Admin authentication is strictly required (handled by middleware).

     if (!candidateId) {
          return res.status(400).json({ message: 'Candidate ID is required' });
     }

     try {
          await db.insert(votes).values({
               candidateId: candidateId,
               source: 'offline'
          });

          cache.del("stats");
          cache.del("results");

          res.json({ message: `Offline vote tallied` });
     } catch (error: any) {
          console.error('Manual Vote Error:', error);
          res.status(500).json({ message: 'Error recording offline vote' });
     }
}

// ... imports
import { desc } from 'drizzle-orm';

// ... existing code

export const getRecentActivity = async (req: Request, res: Response) => {
     try {
          // Admin Activity Stream: Show ALL recent votes (Online & Manual)
          // We query the VOTES table directly for truth
          const recentVotes = await db.select({
               id: votes.id,
               timestamp: votes.timestamp,
               candidateId: votes.candidateId,
               source: votes.source,
               // Join with candidates to show who got the vote (Admin Internal View)
               candidateName: candidates.name
          })
               .from(votes)
               .leftJoin(candidates, eq(votes.candidateId, candidates.id))
               .orderBy(desc(votes.timestamp))
               .limit(10);

          res.json(recentVotes);
     } catch (error) {
          console.error("Activity Error", error);
          res.status(500).json({ message: 'Error fetching activity' });
     }
}

export const deleteVote = async (req: Request, res: Response) => {
     const { id } = req.params;
     try {
          // DB-Side Validation: Delete only if ID matches AND it was created in the last 1 minute
          const result = await db.execute(sql`
               DELETE FROM votes 
               WHERE id = ${id} 
               AND timestamp > NOW() - INTERVAL '1 minute'
               RETURNING id
          `);

          if (result.rowCount === 0) {
               // Check if it exists at all to give better error
               const exists = await db.select({ id: votes.id }).from(votes).where(eq(votes.id, id));
               if (exists.length === 0) {
                    return res.status(404).json({ message: 'Vote not found' });
               }
               return res.status(403).json({ message: 'Cannot delete vote older than 1 minute (Permanent)' });
          }

          // Invalidate cache
          cache.del("stats");
          cache.del("results");

          res.json({ message: 'Vote deleted successfully' });
     } catch (error) {
          console.error("Delete Vote Error", error);
          res.status(500).json({ message: 'Failed to delete vote' });
     }
}
