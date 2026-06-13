import { Router } from 'express';
import SponsorController from '../api/controllers/SponsorController.js';

const router = Router();
const controller = new SponsorController();

router.get('/', controller.getSponsors);
router.get('/challenges', controller.getSponsoredChallenges);
router.get('/clubs', controller.getSponsoredClubs);

export default router;
