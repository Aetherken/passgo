import db from '../config/db.js';

export const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
};

export const requireAdmin = async (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    try {
        const result = await db.query('SELECT role FROM users WHERE id = $1', [req.session.userId]);
        if (result.rows.length === 0) return res.status(401).json({ message: 'User not found.' });

        const role = result.rows[0].role;
        if (role === 'admin' || role === 'superadmin') {
            return next();
        }
        return res.status(403).json({ message: 'Forbidden. Admin access required.' });
    } catch (error) {
        console.error('requireAdmin error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const requireSuperAdmin = async (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    try {
        const result = await db.query('SELECT role FROM users WHERE id = $1', [req.session.userId]);
        if (result.rows.length === 0) return res.status(401).json({ message: 'User not found.' });

        if (result.rows[0].role === 'superadmin') {
            return next();
        }
        return res.status(403).json({ message: 'Forbidden. Super Admin access required.' });
    } catch (error) {
        console.error('requireSuperAdmin error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const requireDriver = async (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    try {
        const result = await db.query('SELECT role FROM users WHERE id = $1', [req.session.userId]);
        if (result.rows.length === 0) return res.status(401).json({ message: 'User not found.' });

        const role = result.rows[0].role;
        if (role === 'driver' || role === 'admin' || role === 'superadmin') {
            return next();
        }
        return res.status(403).json({ message: 'Forbidden. Driver access required.' });
    } catch (error) {
        console.error('requireDriver error:', error);
        res.status(500).json({ message: error.message });
    }
};