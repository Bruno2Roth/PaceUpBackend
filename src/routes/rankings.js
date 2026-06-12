import { Router } from 'express';
import RankingController from '../api/controllers/RankingController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';

const router = Router();
const controller = new RankingController();

router.get('/leaderboard', controller.getLeaderboard.bind(controller));
router.get('/global', controller.getGlobalRankings.bind(controller));
router.get('/my-rank', authMiddleware, controller.getUserRank.bind(controller));
router.get('/club/:clubId', controller.getClubRankings.bind(controller));
router.get('/monthly', controller.getMonthlyRankings.bind(controller));
router.get('/yearly', controller.getYearlyRankings.bind(controller));

export default router;
