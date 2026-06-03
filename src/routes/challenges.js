import { Router } from 'express';
import ChallengeController from '../api/controllers/ChallengeController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';

const router = Router();
const controller = new ChallengeController();

router.post('/', authMiddleware, controller.createChallenge.bind(controller));
router.get('/', controller.getActiveChallenges.bind(controller));
router.get('/search', controller.searchChallenges.bind(controller));
router.get('/:id', controller.getChallenge.bind(controller));
router.post('/:id/join', authMiddleware, controller.joinChallenge.bind(controller));
router.post('/:id/leave', authMiddleware, controller.leaveChallenge.bind(controller));
router.get('/:id/leaderboard', controller.getChallengeLeaderboard.bind(controller));
router.get('/user/:id', controller.getUserChallenges.bind(controller));

export default router;
