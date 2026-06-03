import { Router } from 'express';
import UserController from '../api/controllers/UserController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';

const router = Router();
const controller = new UserController();

router.get('/profile', authMiddleware, controller.getProfile.bind(controller));
router.put('/profile', authMiddleware, controller.updateProfile.bind(controller));
router.post('/profile/photo', authMiddleware, controller.uploadProfilePicture.bind(controller));
router.get('/:id', controller.getUserById.bind(controller));
router.get('/:id/activities', controller.getUserActivities?.bind(controller) || ((req,res)=>res.status(501).json({error:'Not implemented'})));
router.get('/:id/stats', controller.getUserStats.bind(controller));
router.get('/', controller.searchUsers.bind(controller));
router.post('/:id/follow', authMiddleware, controller.followUser.bind(controller));
router.delete('/:id/follow', authMiddleware, controller.unfollowUser.bind(controller));
router.get('/:id/followers', controller.getFollowers.bind(controller));
router.get('/:id/following', controller.getFollowing.bind(controller));

export default router;
