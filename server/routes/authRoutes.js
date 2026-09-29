import express from 'express';
import { register, login, logout, getMe, verifyEmail, resendVerification } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', getMe);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

export default router;
