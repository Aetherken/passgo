import express from 'express';
import multer from 'multer';
import {
    getBuses, addBus, updateBus, deleteBus,
    getStudents, toggleStudentState, flagStudent,
    sendNotification, getDashboardStats,
    getTimeSlots, addTimeSlot, updateTimeSlot,
    getAllBookings, getRevenueData,
    getDrivers, addDriver, deleteCity, deleteRoute
} from '../controllers/adminController.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/auth.js';
import db from '../config/db.js';

const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Public fare endpoint (no auth needed - students need to see the fare)
router.get('/fare', async (req, res) => {
    try {
        const result = await db.query('SELECT flat_fare FROM fare_config ORDER BY id DESC LIMIT 1');
        const fare = result.rows.length > 0 ? Number(result.rows[0].flat_fare) : 25;
        res.status(200).json({ fare });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch fare.' });
    }
});

// All routes below require at least Admin privileges
router.use(requireAdmin);

// Dashboards & Metrics
router.get('/stats', getDashboardStats);

// Bus Management
router.get('/buses', getBuses);
router.post('/buses', upload.single('image'), addBus);
router.put('/buses/:id', updateBus);
router.delete('/buses/:id', deleteBus);

// Time Slot Management
router.get('/timeslots', getTimeSlots);
router.post('/timeslots', addTimeSlot);
router.put('/timeslots/:id', updateTimeSlot);

// All Bookings
router.get('/bookings', getAllBookings);

// Revenue Data
router.get('/revenue', getRevenueData);

// Driver Management
router.get('/drivers', getDrivers);
router.post('/drivers', requireSuperAdmin, addDriver);

// Student Management
router.get('/students', getStudents);
router.patch('/students/:id/toggle', toggleStudentState);
router.post('/students/:id/flag', flagStudent);

// Notifications & Comm
router.post('/notifications', sendNotification);

// SUPER ADMIN ONLY FEATURES
router.post('/cities', requireSuperAdmin, async (req, res) => {
    try {
        const cityRes = await db.query(
            'INSERT INTO cities (name, description) VALUES ($1, $2) RETURNING id',
            [req.body.name, req.body.description || 'Campus destination city.']
        );
        const cityId = cityRes.rows[0].id;
        const dist = req.body.distanceKm ? Number(req.body.distanceKm) : 35.0;
        const dur = req.body.durationMins ? Number(req.body.durationMins) : 60;

        await db.query(
            'INSERT INTO routes (origin, destination_id, distance_km, estimated_duration_mins) VALUES ($1, $2, $3, $4)',
            ['Vimal Jyothi Engineering College', cityId, dist, dur]
        );

        res.status(201).json({ id: cityId, name: req.body.name, description: req.body.description });
    } catch (err) {
        console.error('Add City error:', err);
        res.status(500).json({ message: 'Failed to insert city and route.' });
    }
});

router.delete('/cities/:id', requireSuperAdmin, deleteCity);
router.delete('/routes/:id', requireSuperAdmin, deleteRoute);

router.post('/routes', requireSuperAdmin, async (req, res) => {
    try {
        const result = await db.query(
            'INSERT INTO routes (destination_id, distance_km, estimated_duration_mins) VALUES ($1, $2, $3) RETURNING id',
            [req.body.destinationId, req.body.distanceKm, req.body.durationMins]
        );
        res.status(201).json({ id: result.rows[0].id, ...req.body });
    } catch (err) {
        res.status(500).json({ message: 'Failed to insert route.' });
    }
});

router.patch('/fare', requireSuperAdmin, async (req, res) => {
    try {
        const { flatFare } = req.body;
        await db.query(
            'INSERT INTO fare_config (flat_fare, updated_by) VALUES ($1, $2)',
            [flatFare, req.session.userId]
        );
        res.status(200).json({ message: 'Fare updated successfully', newFare: flatFare });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update fare.' });
    }
});

export default router;
