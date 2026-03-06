import express from 'express';
import multer from 'multer';
import { getBuses, addBus, deleteBus, getStudents, toggleStudentState, flagStudent, sendNotification, getDashboardStats } from '../controllers/adminController.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/auth.js';
import db from '../config/db.js';

const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// All routes require at least Admin privileges
router.use(requireAdmin);

// Dashboards & Metrics
router.get('/stats', getDashboardStats);

// Bus Management
router.get('/buses', getBuses);
router.post('/buses', upload.single('image'), addBus);
router.delete('/buses/:id', deleteBus);

// Student Management
router.get('/students', getStudents);
router.patch('/students/:id/toggle', toggleStudentState);
router.post('/students/:id/flag', flagStudent);

// Notifications & Comm
router.post('/notifications', sendNotification);

// SUPER ADMIN ONLY FEATURES
// Managing cities, routes, and global fare
router.post('/cities', requireSuperAdmin, async (req, res) => {
    try {
        const [result] = await db.query('INSERT INTO cities (name, description) VALUES (?, ?)', [req.body.name, req.body.description]);
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) { res.status(500).json({ message: 'Failed to insert city.' }) }
});

router.post('/routes', requireSuperAdmin, async (req, res) => {
    try {
        const [result] = await db.query('INSERT INTO routes (destination_id, distance_km, estimated_duration_mins) VALUES (?, ?, ?)',
            [req.body.destinationId, req.body.distanceKm, req.body.durationMins]);
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) { res.status(500).json({ message: 'Failed to insert route.' }) }
});

router.patch('/fare', requireSuperAdmin, async (req, res) => {
    try {
        const { flatFare } = req.body;
        await db.query('INSERT INTO fare_config (flat_fare, updated_by) VALUES (?, ?)', [flatFare, req.session.userId]);
        res.status(200).json({ message: 'Fare updated successfully', newFare: flatFare });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update fare.' });
    }
});

export default router;
