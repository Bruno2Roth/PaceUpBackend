import { Router } from 'express';
import ClubController from '../api/controllers/ClubController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';

const router = Router();
const controller = new ClubController();

router.post('/', authMiddleware, controller.createClub.bind(controller));
router.get('/', controller.getPublicClubs.bind(controller));
router.get('/search', controller.searchClubs.bind(controller));
router.get('/:id', controller.getClub.bind(controller));
router.put('/:id', authMiddleware, controller.updateClub.bind(controller));
router.delete('/:id', authMiddleware, controller.deleteClub.bind(controller));
router.post('/:id/join', authMiddleware, controller.joinClub.bind(controller));
router.delete('/:id/leave', authMiddleware, controller.leaveClub.bind(controller));
router.get('/:id/members', controller.getClubMembers.bind(controller));
router.get('/:id/activities', controller.getClubActivities.bind(controller));

export default router;
