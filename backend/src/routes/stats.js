import { Router } from 'express';
import { getDashboard, getIncome } from '../controllers/stats.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/dashboard', getDashboard);
router.get('/income', getIncome);

export default router;
