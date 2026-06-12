import { Router } from 'express';
import multer from 'multer';
import UserController from '../api/controllers/UserController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';

const upload = multer({ dest: 'uploads/' });
const router = Router();
const controller = new UserController();

router.get('/profile', authMiddleware, controller.getProfile.bind(controller));
router.put('/profile', authMiddleware, controller.updateProfile.bind(controller));
router.post('/profile/photo', authMiddleware, upload.single('photo'), controller.uploadProfilePicture.bind(controller));
router.get('/search', controller.searchUsers.bind(controller));
router.get('/:id', controller.getUserById.bind(controller));
router.get('/:id/activities', controller.getUserActivities.bind(controller));
router.get('/:id/stats', controller.getUserStats.bind(controller));
router.post('/:id/follow', authMiddleware, controller.followUser.bind(controller));
router.delete('/:id/follow', authMiddleware, controller.unfollowUser.bind(controller));
router.get('/:id/followers', controller.getFollowers.bind(controller));
router.get('/:id/following', controller.getFollowing.bind(controller));

export default router;
