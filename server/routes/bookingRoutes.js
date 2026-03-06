import express from 'express';
import { getCities, getRoutes, getSlotsByRoute, createBooking, getMyBookings, verifyBooking } from '../controllers/bookingController.js';
import { requireAuth, requireDriver } from '../middleware/auth.js';

const router = express.Router();

router.get('/cities', getCities);
router.get('/routes', getRoutes);
router.get('/routes/:id/slots', getSlotsByRoute);

// Protected student routes
router.post('/', requireAuth, createBooking);
router.get('/my', requireAuth, getMyBookings);

// Protected driver/admin route
router.patch('/:id/verify', requireDriver, verifyBooking);

export default router;
