import { Router } from 'express';
import { getCandidates, createCandidate, updateCandidate, deleteCandidate, restoreCandidate, permanentDeleteCandidate } from '../controllers/candidateController';
import { authenticateAdmin } from '../middleware/adminAuth';

const router = Router();

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
router.get('/', getCandidates as any);
router.post('/', authenticateAdmin, createCandidate as any);

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
router.put('/:id', authenticateAdmin, updateCandidate as any);
router.delete('/:id', authenticateAdmin, deleteCandidate as any);

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
router.post('/:id/restore', authenticateAdmin, restoreCandidate as any);

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
router.delete('/:id/permanent', authenticateAdmin, permanentDeleteCandidate as any);

export default router;
