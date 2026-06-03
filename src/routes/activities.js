import { Router } from 'express';
import ActivityController from '../api/controllers/ActivityController.js';
import authMiddleware from '../api/middlewares/authMiddleware.js';
import { activityValidation } from '../validations/activityValidation.js';
import { activityImportValidation } from '../validations/activityImportValidation.js';

const router = Router();
const controller = new ActivityController();

router.post('/', authMiddleware, activityValidation, controller.createActivity.bind(controller));
router.post('/import', authMiddleware, activityImportValidation, controller.importActivities.bind(controller));
router.post('/sync', authMiddleware, activityImportValidation, controller.importActivities.bind(controller));
router.get('/', controller.getActivities.bind(controller));
router.get('/feed', authMiddleware, controller.getFollowingActivitiesFeed?.bind(controller) || ((req, res) => res.status(501).json({ error: 'Not implemented' })));
router.get('/:id', controller.getActivity.bind(controller));
router.put('/:id', authMiddleware, controller.updateActivity.bind(controller));
router.delete('/:id', authMiddleware, controller.deleteActivity.bind(controller));
router.post('/:id/like', authMiddleware, controller.likeActivity.bind(controller));
router.delete('/:id/like', authMiddleware, controller.unlikeActivity.bind(controller));
router.post('/:id/comment', authMiddleware, controller.commentOnActivity.bind(controller));
router.get('/:id/comments', controller.getActivityComments.bind(controller));
router.get('/:id/stats', controller.getActivityStats.bind(controller));

export default router;
