import { Router, Request, Response } from 'express';
import { db } from '../config/db';
import { systemSettings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireSuperAdmin as authorizeAdmin } from '../middleware/adminAuth';
import { logAction } from '../utils/actionLogger';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: System settings
 */

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get system settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: System settings
 *       500:
 *         description: Internal Server Error
 */
router.get('/', async (req: Request, res: Response) => {
     try {
          const settings = await db.select().from(systemSettings).limit(1);

          if (settings.length === 0) {
               // Create default settings if not exists
               const defaultSettings = await db.insert(systemSettings).values({
                    isVoteOpen: false,
                    showAnnouncement: false
               }).returning();
               res.json(defaultSettings[0]);
               return;
          }

          res.json(settings[0]);
     } catch (error) {
          console.error('Error fetching settings:', error);
          res.status(500).json({ message: 'Internal Server Error' });
     }
});

// PUT /api/settings (Admin only)
router.put('/', authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
     try {
          const { isVoteOpen, startDate, endDate, announcementMessage, showAnnouncement } = req.body;

          const existing = await db.select().from(systemSettings).limit(1);

          if (existing.length === 0) {
               const newSettings = await db.insert(systemSettings).values({
                    isVoteOpen,
                    startDate: startDate ? new Date(startDate) : null,
                    endDate: endDate ? new Date(endDate) : null,
                    announcementMessage,
                    showAnnouncement
               }).returning();
               res.json(newSettings[0]);
          } else {
               const updatedSettings = await db.update(systemSettings)
                    .set({
                         isVoteOpen,
                         startDate: startDate ? new Date(startDate) : null,
                         endDate: endDate ? new Date(endDate) : null,
                         announcementMessage,
                         showAnnouncement,
                         updatedAt: new Date()
                    })
                    .where(eq(systemSettings.id, existing[0].id))
                    .returning();

               // Log Activity
               await logAction(
                    req,
                    "UPDATE_SETTINGS",
                    "System Settings",
                    `Updated settings. Vote Open: ${isVoteOpen}, Announcement: ${showAnnouncement}`
               );

               res.json(updatedSettings[0]);
          }
     } catch (error) {
          console.error('Error updating settings:', error);
          res.status(500).json({ message: 'Internal Server Error' });
     }
});

export default router;
