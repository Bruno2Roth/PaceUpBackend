import { Router } from 'express';
import multer from 'multer';
import authMiddleware from '../api/middlewares/authMiddleware.js';
import premiumMiddleware from '../api/middlewares/premiumMiddleware.js';
import FileImportController from '../api/controllers/FileImportController.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const router = Router();
const controller = new FileImportController();

router.use(authMiddleware);
router.use(premiumMiddleware('advanced_routes'));

router.post('/gpx', upload.single('file'), controller.importGpx.bind(controller));
router.post('/fit', upload.single('file'), controller.importFit.bind(controller));
router.post('/tcx', upload.single('file'), controller.importTcx.bind(controller));

export default router;
