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
exports.getResults = exports.getStats = exports.getVoteStatus = exports.vote = void 0;
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
        // Transaction
        yield db_1.db.transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Check if user has voted
            const userCheck = yield tx.select({ hasVoted: schema_1.users.hasVoted }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
            if (userCheck[0].hasVoted) {
                throw new Error('User has already voted'); // Breaks transaction
            }
            // Insert vote
            yield tx.insert(schema_1.votes).values({
                voterId: userId,
                candidateId: candidateId
            });
            // Update user
            yield tx.update(schema_1.users).set({ hasVoted: true }).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        }));
        // Invalidate cache immediately after a vote (optional, but good for accuracy)
        // or just let it expire. Let's expire it to show real-time progress better.
        cache.del("stats");
        cache.del("results");
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
        // Group by candidate and count
        const results = yield db_1.db.select({
            candidateId: schema_1.votes.candidateId,
            count: (0, drizzle_orm_1.sql) `count(*)`
        }).from(schema_1.votes).groupBy(schema_1.votes.candidateId);
        // Fetch candidates to map names (or do a join)
        const candidatesData = yield db_1.db.select().from(schema_1.candidates);
        // Map results to candidates
        const finalResults = candidatesData.map(c => {
            const found = results.find(r => r.candidateId === c.id);
            return {
                id: c.id,
                name: c.name,
                votes: Number((found === null || found === void 0 ? void 0 : found.count) || 0),
                fill: c.orderNumber === 1 ? "#3b82f6" : "#ef4444" // Simply color logic
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
