import { Router } from 'express';
import { register, login, refresh, logout, updateLanguage, updateProfile, changePassword } from '../controllers/auth.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.put('/language', authenticate, updateLanguage);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);

export default router;
