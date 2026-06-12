import { Router } from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import activityRoutes from './activities.js';
import notificationRoutes from './notifications.js';
import clubRoutes from './clubs.js';
import challengeRoutes from './challenges.js';
import routeRoutes from './routes.js';
import rankingRoutes from './rankings.js';
import xpRoutes from './xp.js';
import achievementRoutes from './achievements.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/activities', activityRoutes);
router.use('/notifications', notificationRoutes);
router.use('/clubs', clubRoutes);
router.use('/challenges', challengeRoutes);
router.use('/routes', routeRoutes);
router.use('/rankings', rankingRoutes);
router.use('/xp', xpRoutes);
router.use('/achievements', achievementRoutes);

export default router;
