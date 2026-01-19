import { Router } from 'express';
import authController from '../controllers/auth.controller.js';

const router = Router();


router.get('/initiate', authController.initiate.bind(authController));
router.get('/callback', authController.callback.bind(authController));

export default router;