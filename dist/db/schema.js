"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemSettings = exports.actionLogs = exports.otpCodes = exports.votes = exports.candidates = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    nim: (0, pg_core_1.text)('nim').unique().notNull(),
    email: (0, pg_core_1.text)('email').unique(),
    name: (0, pg_core_1.text)('name'),
    password: (0, pg_core_1.text)('password'),
    role: (0, pg_core_1.text)('role').notNull().default('voter'), // 'admin', 'voter'
    hasVoted: (0, pg_core_1.boolean)('has_voted').default(false),
    votedAt: (0, pg_core_1.timestamp)('voted_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at', { withTimezone: true }), // Soft Delete
});
exports.candidates = (0, pg_core_1.pgTable)('candidates', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    vision: (0, pg_core_1.text)('vision').notNull(),
    mission: (0, pg_core_1.text)('mission').notNull(),
    photoUrl: (0, pg_core_1.text)('photo_url'),
    orderNumber: (0, pg_core_1.integer)('order_number').unique().notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at', { withTimezone: true }), // Soft Delete
});
exports.votes = (0, pg_core_1.pgTable)('votes', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    candidateId: (0, pg_core_1.uuid)('candidate_id').notNull().references(() => exports.candidates.id),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true }).defaultNow(),
    source: (0, pg_core_1.text)('source').default('online'),
});
exports.otpCodes = (0, pg_core_1.pgTable)('otp_codes', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    email: (0, pg_core_1.text)('email').notNull(),
    code: (0, pg_core_1.text)('code').notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
});
exports.actionLogs = (0, pg_core_1.pgTable)('action_logs', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    actorId: (0, pg_core_1.uuid)('actor_id'), // Can be null if system action or deleted user
    actorName: (0, pg_core_1.text)('actor_name'), // Snapshot of actor name
    action: (0, pg_core_1.text)('action').notNull(),
    target: (0, pg_core_1.text)('target'),
    details: (0, pg_core_1.text)('details'),
    ipAddress: (0, pg_core_1.text)('ip_address'),
    userAgent: (0, pg_core_1.text)('user_agent'),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true }).defaultNow(),
});
exports.systemSettings = (0, pg_core_1.pgTable)('system_settings', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    isVoteOpen: (0, pg_core_1.boolean)('is_vote_open').default(false).notNull(),
    startDate: (0, pg_core_1.timestamp)('start_date', { withTimezone: true }),
    endDate: (0, pg_core_1.timestamp)('end_date', { withTimezone: true }),
    announcementMessage: (0, pg_core_1.text)('announcement_message'),
    showAnnouncement: (0, pg_core_1.boolean)('show_announcement').default(false).notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow(),
});
