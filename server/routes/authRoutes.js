import express from 'express';
import { register, login, logout, getMe, verifyEmail, resendVerification } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', getMe);

export default router;
