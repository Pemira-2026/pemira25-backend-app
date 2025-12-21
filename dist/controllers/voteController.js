"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVote = exports.getRecentActivity = exports.manualVote = exports.getResults = exports.getStats = exports.getVoteStatus = exports.vote = void 0;
const db_1 = require("../config/db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const node_cache_1 = __importDefault(require("node-cache"));
const cache = new node_cache_1.default({ stdTTL: 30 }); // 30 seconds cache
const vote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { candidateId } = req.body;
    const userId = req.user.id;
    if (!candidateId) {
        return res.status(400).json({ message: 'Candidate ID is required' });
    }
    try {
        yield db_1.db.transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const userCheck = yield tx.select({ hasVoted: schema_1.users.hasVoted }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
            if (userCheck[0].hasVoted) {
                throw new Error('User has already voted');
            }
            yield tx.insert(schema_1.votes).values({
                candidateId: candidateId,
                source: 'online'
            });
            yield tx.update(schema_1.users)
                .set({ hasVoted: true, votedAt: (0, drizzle_orm_1.sql) `now()` })
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        }));
        cache.del("stats");
        cache.del("results");
        cache.del("recent-activity");
        res.json({ message: 'Vote cast successfully' });
    }
    catch (error) {
        console.error('Vote error:', error);
        if (error.message === 'User has already voted') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error casting vote' });
    }
});
exports.vote = vote;
const getVoteStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = req.user.id;
    try {
        const result = yield db_1.db.select({ hasVoted: schema_1.users.hasVoted }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        res.json({ hasVoted: ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.hasVoted) || false });
    }
    catch (error) {
        res.status(500).json({ message: 'Error checking status' });
    }
});
exports.getVoteStatus = getVoteStatus;
const getStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cached = cache.get("stats");
        if (cached)
            return res.json(cached);
        const userCount = yield db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.users);
        const voteCount = yield db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.votes);
        const onlineCount = yield db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.votes).where((0, drizzle_orm_1.eq)(schema_1.votes.source, 'online'));
        const offlineCount = yield db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.votes).where((0, drizzle_orm_1.eq)(schema_1.votes.source, 'offline'));
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
    }
    catch (error) {
        console.error("Stats Error", error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
});
exports.getStats = getStats;
const getResults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cached = cache.get("results");
        if (cached)
            return res.json(cached);
        // Group by candidate and source
        const results = yield db_1.db.select({
            candidateId: schema_1.votes.candidateId,
            source: schema_1.votes.source,
            count: (0, drizzle_orm_1.sql) `count(*)`
        })
            .from(schema_1.votes)
            .groupBy(schema_1.votes.candidateId, schema_1.votes.source);
        // Fetch candidates to map names
        const candidatesData = yield db_1.db.select().from(schema_1.candidates);
        // Map results to candidates
        const finalResults = candidatesData.map(c => {
            var _a, _b;
            const onlineCount = ((_a = results.find(r => r.candidateId === c.id && r.source === 'online')) === null || _a === void 0 ? void 0 : _a.count) || 0;
            const offlineCount = ((_b = results.find(r => r.candidateId === c.id && r.source === 'offline')) === null || _b === void 0 ? void 0 : _b.count) || 0;
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
    }
    catch (error) {
        console.error("Results Error", error);
        res.status(500).json({ message: 'Error fetching results' });
    }
});
exports.getResults = getResults;
const manualVote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { candidateId } = req.body;
    // NO NIM required for offline tally (per user request).
    // This function is purely for "Ballot Box Stuffing" (Tallying paper votes).
    // Admin authentication is strictly required (handled by middleware).
    if (!candidateId) {
        return res.status(400).json({ message: 'Candidate ID is required' });
    }
    try {
        yield db_1.db.insert(schema_1.votes).values({
            candidateId: candidateId,
            source: 'offline'
        });
        cache.del("stats");
        cache.del("results");
        res.json({ message: `Offline vote tallied` });
    }
    catch (error) {
        console.error('Manual Vote Error:', error);
        res.status(500).json({ message: 'Error recording offline vote' });
    }
});
exports.manualVote = manualVote;
// ... imports
const drizzle_orm_2 = require("drizzle-orm");
// ... existing code
const getRecentActivity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const recentVotes = yield db_1.db.select({
            id: schema_1.votes.id,
            timestamp: schema_1.votes.timestamp,
            candidateId: schema_1.votes.candidateId,
            source: schema_1.votes.source,
            candidateName: schema_1.candidates.name
        })
            .from(schema_1.votes)
            .leftJoin(schema_1.candidates, (0, drizzle_orm_1.eq)(schema_1.votes.candidateId, schema_1.candidates.id))
            .orderBy((0, drizzle_orm_2.desc)(schema_1.votes.timestamp))
            .limit(10);
        res.json(recentVotes);
    }
    catch (error) {
        console.error("Activity Error", error);
        res.status(500).json({ message: 'Error fetching activity' });
    }
});
exports.getRecentActivity = getRecentActivity;
const deleteVote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const result = yield db_1.db.execute((0, drizzle_orm_1.sql) `
               DELETE FROM votes 
               WHERE id = ${id} 
               AND timestamp > NOW() - INTERVAL '1 minute'
               RETURNING id
          `);
        if (result.rowCount === 0) {
            const exists = yield db_1.db.select({ id: schema_1.votes.id }).from(schema_1.votes).where((0, drizzle_orm_1.eq)(schema_1.votes.id, id));
            if (exists.length === 0) {
                return res.status(404).json({ message: 'Vote not found' });
            }
            return res.status(403).json({ message: 'Cannot delete vote older than 1 minute (Permanent)' });
        }
        cache.del("stats");
        cache.del("results");
        res.json({ message: 'Vote deleted successfully' });
    }
    catch (error) {
        console.error("Delete Vote Error", error);
        res.status(500).json({ message: 'Failed to delete vote' });
    }
});
exports.deleteVote = deleteVote;
