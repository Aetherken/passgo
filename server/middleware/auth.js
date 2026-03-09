import db from '../config/db.js';

// Verify session and attach user to req
export const requireAuth = async (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated. Please log in.' });
    }

    try {
        const result = await db.query(
            'SELECT id, name, role, is_active FROM users WHERE id = $1',
            [req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'User not found.' });
        }

        const user = result.rows[0];
        if (!user.is_active) {
            return res.status(403).json({ message: 'Account deactivated.' });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err);
        return res.status(500).json({ message: 'Internal Server Error during authentication.' });
    }
};

// Require admin or superadmin role
export const requireAdmin = async (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'No token provided.' });
    }

    try {
        const result = await db.query(
            'SELECT id, name, role, is_active FROM users WHERE id = $1',
            [req.session.userId]
        );

        if (result.rows.length === 0 || !result.rows[0].is_active) {
            return res.status(401).json({ message: 'Invalid or expired session.' });
        }

        const user = result.rows[0];
        if (user.role !== 'admin' && user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Admin access required.' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Access denied.' });
    }
};

// Require superadmin role only
export const requireSuperAdmin = async (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'No token provided.' });
    }

    try {
        const result = await db.query(
            'SELECT role FROM users WHERE id = $1',
            [req.session.userId]
        );

        if (result.rows.length === 0 || result.rows[0].role !== 'superadmin') {
            return res.status(403).json({ message: 'Superadmin access required.' });
        }

        req.user = result.rows[0];
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Access denied.' });
    }
};

// Require driver, admin, or superadmin role
export const requireDriver = async (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'No token provided.' });
    }

    try {
        const result = await db.query(
            'SELECT id, name, role FROM users WHERE id = $1',
            [req.session.userId]
        );

        const user = result.rows[0];
        if (!user || (user.role !== 'driver' && user.role !== 'admin' && user.role !== 'superadmin')) {
            return res.status(403).json({ message: 'Driver access required.' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Access denied.' });
    }
};
