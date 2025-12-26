"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const candidateController_1 = require("../controllers/candidateController");
const adminAuth_1 = require("../middleware/adminAuth");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Candidates
 *   description: Candidate management
 */
/**
 * @swagger
 * /api/candidates:
 *   get:
 *     summary: Get all candidates
 *     tags: [Candidates]
 *     responses:
 *       200:
 *         description: List of candidates
 *   post:
 *     summary: Create a new candidate (Admin only)
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - number
 *             properties:
 *               name:
 *                 type: string
 *               number:
 *                 type: integer
 *               vision:
 *                 type: string
 *               mission:
 *                 type: string
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Candidate created
 */
router.get('/', candidateController_1.getCandidates);
router.post('/', adminAuth_1.authenticateAdmin, candidateController_1.createCandidate);
/**
 * @swagger
 * /api/candidates/{id}:
 *   put:
 *     summary: Update a candidate (Admin only)
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               number:
 *                 type: integer
 *               vision:
 *                 type: string
 *               mission:
 *                 type: string
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Candidate updated
 *   delete:
 *     summary: Soft delete a candidate (Admin only)
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Candidate deleted
 */
router.put('/:id', adminAuth_1.authenticateAdmin, candidateController_1.updateCandidate);
router.delete('/:id', adminAuth_1.authenticateAdmin, candidateController_1.deleteCandidate);
/**
 * @swagger
 * /api/candidates/{id}/restore:
 *   post:
 *     summary: Restore a soft-deleted candidate (Admin only)
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Candidate restored
 */
router.post('/:id/restore', adminAuth_1.authenticateAdmin, candidateController_1.restoreCandidate);
/**
 * @swagger
 * /api/candidates/{id}/permanent:
 *   delete:
 *     summary: Permanently delete a candidate (Admin only)
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Candidate permanently deleted
 */
router.delete('/:id/permanent', adminAuth_1.authenticateAdmin, candidateController_1.permanentDeleteCandidate);
exports.default = router;
