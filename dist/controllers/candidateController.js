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
Object.defineProperty(exports, "__esModule", { value: true });
exports.permanentDeleteCandidate = exports.restoreCandidate = exports.deleteCandidate = exports.updateCandidate = exports.createCandidate = exports.getCandidates = void 0;
const db_1 = require("../config/db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const actionLogger_1 = require("../utils/actionLogger");
// Helper to trigger frontend revalidation
const triggerRevalidation = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        yield fetch(`${frontendUrl}/api/revalidate?tag=candidates`, { method: 'POST' });
    }
    catch (error) {
        console.error('Failed to trigger revalidation:', error);
    }
});
const getCandidates = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { includeDeleted } = req.query;
        const shouldIncludeDeleted = includeDeleted === 'true';
        let query = db_1.db.select().from(schema_1.candidates).$dynamic();
        if (!shouldIncludeDeleted) {
            query = query.where((0, drizzle_orm_1.isNull)(schema_1.candidates.deletedAt));
        }
        const result = yield query.orderBy((0, drizzle_orm_1.asc)(schema_1.candidates.orderNumber));
        res.json(result);
    }
    catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getCandidates = getCandidates;
const createCandidate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, vision, mission, orderNumber, photoUrl } = req.body;
    try {
        yield db_1.db.insert(schema_1.candidates).values({
            name,
            vision,
            mission,
            orderNumber: Number(orderNumber),
            photoUrl
        });
        res.status(201).json({ message: 'Candidate created successfully' });
        yield (0, actionLogger_1.logAction)(req, 'CREATE_CANDIDATE', `Name: ${name}, Order: ${orderNumber}`);
        triggerRevalidation();
    }
    catch (error) {
        console.error('Create candidate error:', error);
        res.status(500).json({ message: 'Failed to create candidate' });
    }
});
exports.createCandidate = createCandidate;
const updateCandidate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, vision, mission, orderNumber, photoUrl } = req.body;
    try {
        yield db_1.db.update(schema_1.candidates)
            .set({ name, vision, mission, orderNumber: Number(orderNumber), photoUrl })
            .where((0, drizzle_orm_1.eq)(schema_1.candidates.id, id));
        res.json({ message: 'Candidate updated successfully' });
        yield (0, actionLogger_1.logAction)(req, 'UPDATE_CANDIDATE', `ID: ${id}, Name: ${name}`);
        triggerRevalidation();
    }
    catch (error) {
        console.error('Update candidate error:', error);
        res.status(500).json({ message: 'Failed to update candidate' });
    }
});
exports.updateCandidate = updateCandidate;
const deleteCandidate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        // Soft Delete: Mark as deleted to allow recovery/safety
        yield db_1.db.update(schema_1.candidates)
            .set({ deletedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.candidates.id, id));
        res.json({ message: 'Candidate deleted (Soft)' });
        yield (0, actionLogger_1.logAction)(req, 'DELETE_CANDIDATE', `ID: ${id}`);
        triggerRevalidation();
    }
    catch (error) {
        console.error('Delete candidate error:', error);
        res.status(500).json({ message: 'Failed to delete candidate' });
    }
});
exports.deleteCandidate = deleteCandidate;
const restoreCandidate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield db_1.db.update(schema_1.candidates)
            .set({ deletedAt: null })
            .where((0, drizzle_orm_1.eq)(schema_1.candidates.id, id));
        res.json({ message: 'Candidate restored' });
        yield (0, actionLogger_1.logAction)(req, 'RESTORE_CANDIDATE', `ID: ${id}`);
        triggerRevalidation();
    }
    catch (error) {
        console.error('Restore candidate error:', error);
        res.status(500).json({ message: 'Failed to restore candidate' });
    }
});
exports.restoreCandidate = restoreCandidate;
const permanentDeleteCandidate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield db_1.db.delete(schema_1.candidates).where((0, drizzle_orm_1.eq)(schema_1.candidates.id, id));
        res.json({ message: 'Candidate permanently deleted' });
        yield (0, actionLogger_1.logAction)(req, 'PERMANENT_DELETE_CANDIDATE', `ID: ${id}`);
        triggerRevalidation();
    }
    catch (error) {
        console.error('Permanent delete candidate error:', error);
        res.status(500).json({ message: 'Failed to permanently delete candidate' });
    }
});
exports.permanentDeleteCandidate = permanentDeleteCandidate;
