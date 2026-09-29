import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/authRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import db from './config/db.js';
import { getCities, getRoutes, getSlotsByRoute, getFare } from './controllers/bookingController.js';
import { getBuses, getTimeSlots } from './controllers/adminController.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// MUST be at the very top for Render/Railway
app.set('trust proxy', 1);

// Middleware
app.use((req, res, next) => {
    if (isProduction) {
        console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin}`);
    }
    next();
});

// Comprehensive CORS for Vercel, Localhost, & Render
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, mobile, server-to-server)
        if (!origin) return callback(null, true);

        const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
        const isVercel = origin.endsWith('.vercel.app') || origin.includes('vercel.app');
        const isClientUrl = process.env.CLIENT_URL && origin.startsWith(process.env.CLIENT_URL.replace(/\/$/, ''));

        if (isLocal || isVercel || isClientUrl) {
            return callback(null, true);
        }

        // Permissive fallback so production Vercel frontend never gets blocked
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-User-Id', 'x-user-id']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'passgo_super_secret_key',
        resave: false,
        saveUninitialized: false,
        name: 'passgo.sid', // custom name to avoid generic connect.sid
        cookie: {
            secure: isProduction,
            httpOnly: true,
            sameSite: isProduction ? 'none' : 'lax', // Lax for dev, None for cross-site prod
            maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        }
    })
);

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public Routes (No Auth)
app.use('/api/public', (req, res, next) => {
    // Shared public getters
    next();
});

// Primary Mounts for exactly matching Frontend calls
app.get('/api/cities', getCities);
app.get('/api/routes', getRoutes);
app.get('/api/routes/:id/slots', getSlotsByRoute);
app.get('/api/fare', getFare);
app.get('/api/buses', getBuses);
app.get('/api/timeslots', getTimeSlots);

// Standard API Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// Shared Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', msg: 'API up' });
});

// Catch-all 404 for API
app.use('/api', (req, res) => {
    res.status(404).json({ message: `API Path ${req.url} not found` });
});

// Log server-side errors to Render console
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});