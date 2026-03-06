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
        const [users] = await db.query('SELECT role FROM users WHERE id = ?', [req.session.userId]);
        if (users.length === 0) return res.status(401).json({ message: 'User not found.' });

        const role = users[0].role;
        if (role === 'admin' || role === 'superadmin') {
            return next();
        }
        return res.status(403).json({ message: 'Forbidden. Admin access required.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during authorization.' });
    }
};

export const requireSuperAdmin = async (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    try {
        const [users] = await db.query('SELECT role FROM users WHERE id = ?', [req.session.userId]);
        if (users.length === 0) return res.status(401).json({ message: 'User not found.' });

        if (users[0].role === 'superadmin') {
            return next();
        }
        return res.status(403).json({ message: 'Forbidden. Super Admin access required.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during authorization.' });
    }
};

export const requireDriver = async (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    try {
        const [users] = await db.query('SELECT role FROM users WHERE id = ?', [req.session.userId]);
        if (users.length === 0) return res.status(401).json({ message: 'User not found.' });

        const role = users[0].role;
        if (role === 'driver' || role === 'admin' || role === 'superadmin') {
            return next();
        }
        return res.status(403).json({ message: 'Forbidden. Driver access required.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during authorization.' });
    }
};
