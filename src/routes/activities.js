import { Router } from 'express';
import ActivityController from '../api/controllers/ActivityController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';
import { activityValidation } from '../validations/activityValidation.js';
import { activityImportValidation } from '../validations/activityImportValidation.js';
import { commentRateLimit, likeRateLimit, antiFloodMiddleware } from '../api/middlewares/securityMiddleware.js';

const router = Router();
const controller = new ActivityController();

router.post('/', authMiddleware, activityValidation, controller.createActivity.bind(controller));
router.post('/import', authMiddleware, activityImportValidation, controller.importActivities.bind(controller));
router.post('/sync', authMiddleware, activityImportValidation, controller.importActivities.bind(controller));
router.get('/', controller.getActivities.bind(controller));
router.get('/feed', controller.getFeed.bind(controller));
router.get('/:id', controller.getActivity.bind(controller));
router.put('/:id', authMiddleware, controller.updateActivity.bind(controller));
router.delete('/:id', authMiddleware, controller.deleteActivity.bind(controller));

router.post('/:id/like', authMiddleware, likeRateLimit, antiFloodMiddleware(2000, 5), controller.likeActivity.bind(controller));
router.delete('/:id/like', authMiddleware, controller.unlikeActivity.bind(controller));
router.get('/:id/likes', controller.getActivityLikes.bind(controller));

router.post('/:id/comments', authMiddleware, commentRateLimit, antiFloodMiddleware(10000, 3), controller.commentOnActivity.bind(controller));
router.get('/:id/comments', controller.getActivityComments.bind(controller));
router.get('/:id/comments/:commentId/replies', controller.getCommentReplies.bind(controller));
router.put('/:id/comments/:commentId', authMiddleware, controller.updateComment.bind(controller));
router.delete('/:id/comments/:commentId', authMiddleware, controller.deleteComment.bind(controller));

router.get('/:id/stats', controller.getActivityStats.bind(controller));

export default router;
