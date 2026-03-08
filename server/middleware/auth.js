import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY  // service role key - can verify any JWT
);

// Verify Supabase JWT and attach user to req
export const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ message: 'Invalid or expired token.' });
        }
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token verification failed.' });
    }
};

// Require admin or superadmin role
export const requireAdmin = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ message: 'Invalid or expired token.' });
        }

        const role = user.user_metadata?.role;
        if (role !== 'admin' && role !== 'superadmin') {
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
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ message: 'Invalid or expired token.' });
        }

        const role = user.user_metadata?.role;
        if (role !== 'superadmin') {
            return res.status(403).json({ message: 'Superadmin access required.' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Access denied.' });
    }
};
