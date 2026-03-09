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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Trust Render's proxy for secure cookies
app.set('trust proxy', 1);

// CORS configuration - Allow Vercel frontend and localhost
app.use(cors({
    origin: [process.env.CLIENT_URL, 'http://localhost:3000', 'http://localhost:5173'].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
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
            sameSite: isProduction ? 'none' : 'lax', // Lax for dev, None for cross-siteprod
            maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        }
    })
);

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route Definitions
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// Mount booking routes directly at /api for cities/routes compatibility
app.use('/api', bookingRoutes);

// Health Route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'PassGo API is running' });
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