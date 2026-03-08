import bcrypt from 'bcrypt';
import db from '../config/db.js';
import { sendEmail } from '../utils/mailer.js';

export const register = async (req, res) => {
    const { name, studentId, phone, email, password } = req.body;

    try {
        if (!name || !studentId || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // PostgreSQL uses $1, $2 instead of ?
        const existing = await db.query(
            'SELECT id FROM users WHERE email = $1 OR student_id = $2',
            [email, studentId]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ message: 'User with this email or Student ID already exists.' });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // PostgreSQL uses RETURNING instead of insertId
        const result = await db.query(
            'INSERT INTO users (name, student_id, phone, email, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [name, studentId, phone || null, email, passwordHash]
        );

        const newUser = result.rows[0];
        req.session.userId = newUser.id;

        const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to PassGo!</h2>
        <p>Hi ${name},</p>
        <p>Your account has been successfully created.</p>
        <p><strong>Student ID:</strong> ${studentId}</p>
        <p>You can now log in and book your campus bus passes seamlessly.</p>
        <br>
        <p>Best regards,<br>The PassGo Team</p>
      </div>
    `;
        await sendEmail({ to: email, subject: 'Welcome to PassGo', html: emailHtml });

        res.status(201).json({
            message: 'Registration successful.',
            user: { id: newUser.id, name, email, role: 'student' }
        });

    } catch (error) {
        console.error('Registration Error:', JSON.stringify(error, null, 2));
        res.status(500).json({ 
            message: error.message || 'Unknown error',
            detail: error.detail || '',
            code: error.code || ''
        });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(403).json({ message: 'Account deactivated. Please contact administration.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        req.session.userId = user.id;

        res.status(200).json({
            message: 'Login successful.',
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out.' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logged out successfully.' });
    });
};

export const getMe = async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated.' });
    }

    try {
        const result = await db.query(
            'SELECT id, name, student_id, email, phone, role, is_active FROM users WHERE id = $1',
            [req.session.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ user: result.rows[0] });
    } catch (error) {
        console.error('Auth Check Error:', error);
        res.status(500).json({ message: error.message });
    }
};