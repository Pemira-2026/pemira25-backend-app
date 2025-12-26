"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const voteController_1 = require("../controllers/voteController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Votes
 *   description: Voting operations
 */
/**
 * @swagger
 * /api/votes:
 *   post:
 *     summary: Submit a vote
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - candidateId
 *             properties:
 *               candidateId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vote submitted
 *       400:
 *         description: Already voted
 */
router.post('/', authMiddleware_1.authenticateToken, voteController_1.vote);
/**
 * @swagger
 * /api/votes/status:
 *   get:
 *     summary: Get voting status for current user
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vote status
 */
router.get('/status', authMiddleware_1.authenticateToken, voteController_1.getVoteStatus);
/**
 * @swagger
 * /api/votes/stats:
 *   get:
 *     summary: Get voting statistics
 *     tags: [Votes]
 *     responses:
 *       200:
 *         description: Voting statistics
 */
router.get('/stats', voteController_1.getStats); // Public
router.get('/results', voteController_1.getResults); // Public
const adminAuth_1 = require("../middleware/adminAuth");
const voteController_2 = require("../controllers/voteController");
// Offline/Manual Vote (Admin Only)
router.post('/offline', adminAuth_1.authenticateAdmin, voteController_2.manualVote);
router.get('/activity', adminAuth_1.authenticateAdmin, voteController_2.getRecentActivity); // Protected
router.delete('/:id', adminAuth_1.authenticateAdmin, adminAuth_1.requireSuperAdmin, voteController_2.deleteVote); // Super Admin Only, with 1 min check
exports.default = router;
