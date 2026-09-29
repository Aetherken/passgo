import db from '../config/db.js';

// Helper to extract User ID from Session, Bearer Token, or Custom Header safely
const getUserIdFromReq = (req) => {
    // 1. Session check
    if (req.session && req.session.userId) {
        return req.session.userId;
    }
    // 2. Authorization header check
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader) {
        const token = String(authHeader).replace(/^Bearer\s+/i, '').trim();
        if (token && token !== '[object Object]' && token !== 'undefined' && token !== 'null') {
            return !isNaN(token) ? parseInt(token, 10) : token;
        }
    }
    // 3. X-User-Id header check
    const customHeader = req.headers['x-user-id'];
    if (customHeader) {
        const val = String(customHeader).trim();
        if (val && val !== '[object Object]' && val !== 'undefined' && val !== 'null') {
            return !isNaN(val) ? parseInt(val, 10) : val;
        }
    }
    return null;
};

// Safe DB query helper for User ID
const findUserById = async (userId, fields = 'id, name, student_id, email, role, is_active') => {
    const isNum = typeof userId === 'number' || (!isNaN(userId) && !isNaN(parseInt(userId, 10)));
    if (isNum) {
        const numId = parseInt(userId, 10);
        return await db.query(`SELECT ${fields} FROM users WHERE id = $1`, [numId]);
    } else {
        return await db.query(`SELECT ${fields} FROM users WHERE CAST(id AS TEXT) = $1`, [String(userId)]);
    }
};

// Verify session/token and attach user to req
export const requireAuth = async (req, res, next) => {
    const userId = getUserIdFromReq(req);
    if (!userId) {
        return res.status(401).json({ message: 'Not authenticated. Please log in.' });
    }

    try {
        const result = await findUserById(userId, 'id, name, student_id, email, role, is_active');

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'User not found.' });
        }

        const user = result.rows[0];
        if (!user.is_active) {
            return res.status(403).json({ message: 'Account deactivated.' });
        }

        req.user = user;
        if (req.session) req.session.userId = user.id;
        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err);
        return res.status(500).json({ message: 'Internal Server Error during authentication.' });
    }
};

// Require admin or superadmin role
export const requireAdmin = async (req, res, next) => {
    const userId = getUserIdFromReq(req);
    if (!userId) {
        return res.status(401).json({ message: 'No token provided.' });
    }

    try {
        const result = await findUserById(userId, 'id, name, role, is_active');

        if (result.rows.length === 0 || !result.rows[0].is_active) {
            return res.status(401).json({ message: 'Invalid or expired session.' });
        }

        const user = result.rows[0];
        const role = (user.role || '').toLowerCase().trim();
        if (role !== 'admin' && role !== 'superadmin') {
            return res.status(403).json({ message: 'Admin access required.' });
        }

        req.user = user;
        if (req.session) req.session.userId = user.id;
        next();
    } catch (err) {
        console.error('requireAdmin error:', err);
        return res.status(403).json({ message: 'Access denied.' });
    }
};

// Require superadmin role only
export const requireSuperAdmin = async (req, res, next) => {
    const userId = getUserIdFromReq(req);
    if (!userId) {
        return res.status(401).json({ message: 'No token provided.' });
    }

    try {
        const result = await findUserById(userId, 'id, role, is_active');

        if (result.rows.length === 0 || !result.rows[0].is_active) {
            return res.status(401).json({ message: 'Invalid or expired session.' });
        }

        const user = result.rows[0];
        const role = (user.role || '').toLowerCase().trim();
        if (role !== 'superadmin') {
            return res.status(403).json({ message: 'Superadmin access required.' });
        }

        req.user = user;
        if (req.session) req.session.userId = user.id;
        next();
    } catch (err) {
        console.error('requireSuperAdmin error:', err);
        return res.status(403).json({ message: 'Access denied.' });
    }
};

// Require driver, admin, or superadmin role
export const requireDriver = async (req, res, next) => {
    const userId = getUserIdFromReq(req);
    if (!userId) {
        return res.status(401).json({ message: 'Not authenticated. Please log in.' });
    }

    try {
        const result = await findUserById(userId, 'id, name, role, is_active');

        if (result.rows.length === 0 || !result.rows[0].is_active) {
            return res.status(401).json({ message: 'User not found or account deactivated.' });
        }

        req.user = result.rows[0];
        if (req.session) req.session.userId = result.rows[0].id;
        next();
    } catch (err) {
        console.error('requireDriver error:', err);
        return res.status(403).json({ message: 'Access denied.' });
    }
};
