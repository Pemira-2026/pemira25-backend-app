"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpCodes = exports.votes = exports.candidates = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    nim: (0, pg_core_1.text)('nim').unique().notNull(),
    email: (0, pg_core_1.text)('email').unique(),
    name: (0, pg_core_1.text)('name'),
    role: (0, pg_core_1.text)('role').notNull().default('voter'), // 'admin', 'voter'
    hasVoted: (0, pg_core_1.boolean)('has_voted').default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
exports.candidates = (0, pg_core_1.pgTable)('candidates', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    vision: (0, pg_core_1.text)('vision').notNull(),
    mission: (0, pg_core_1.text)('mission').notNull(),
    photoUrl: (0, pg_core_1.text)('photo_url'),
    orderNumber: (0, pg_core_1.integer)('order_number').unique().notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
exports.votes = (0, pg_core_1.pgTable)('votes', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    voterId: (0, pg_core_1.uuid)('voter_id').notNull().references(() => exports.users.id),
    candidateId: (0, pg_core_1.uuid)('candidate_id').notNull().references(() => exports.candidates.id),
    timestamp: (0, pg_core_1.timestamp)('timestamp').defaultNow(),
});
exports.otpCodes = (0, pg_core_1.pgTable)('otp_codes', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    email: (0, pg_core_1.text)('email').notNull(),
    code: (0, pg_core_1.text)('code').notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
