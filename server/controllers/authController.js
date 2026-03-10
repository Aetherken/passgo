import bcrypt from 'bcrypt';
import db from '../config/db.js';
import { sendEmail } from '../utils/mailer.js';
import crypto from 'crypto';

export const register = async (req, res) => {
    const { name, studentId, phone, email, password } = req.body;

    try {
        if (!name || !studentId || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const existing = await db.query(
            'SELECT id FROM users WHERE email = $1 OR student_id = $2',
            [email, studentId]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ message: 'User with this email or Student ID already exists.' });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Generate a 6-digit verification token
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        const result = await db.query(
            'INSERT INTO users (name, student_id, phone, email, password_hash, verification_token) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [name, studentId, phone || null, email, passwordHash, verificationToken]
        );

        const newUser = result.rows[0];
        req.session.userId = newUser.id;

        // Log the token for server console (fallback if email fails)
        console.log(`[VERIFICATION] Token for ${email}: ${verificationToken}`);

        const clientUrl = process.env.CLIENT_URL?.replace(/\/$/, '') || 'http://localhost:5173';
        const verifyLink = `${clientUrl}/verify?token=${verificationToken}&email=${encodeURIComponent(email)}`;

        const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 30px; border: 1px solid #eee; border-radius: 20px; max-width: 600px; margin: 0 auto; background: #fff;">
        <h1 style="color: #131718; text-transform: uppercase; letter-spacing: 5px; text-align: center;">PASSGO</h1>
        <h2 style="text-align: center;">Verify Your Email</h2>
        <p>Hi ${name},</p>
        <p>Your account has been successfully created. Please use the verification code below to activate your account:</p>
        <div style="background: #f8f8f8; padding: 20px; font-size: 32px; font-weight: bold; letter-spacing: 12px; text-align: center; border-radius: 12px; color: #131718; border: 2px solid #131718;">
          ${verificationToken}
        </div>
        <br>
        <p>Alternatively, you can click the link below:</p>
        <p style="text-align: center;">
          <a href="${verifyLink}" 
             style="background: #131718; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
             Verify Account
          </a>
        </p>
        <p>Best regards,<br>The PassGo Team</p>
      </div>
    `;

        // Send email non-blocking to prevent registration hang
        sendEmail({ to: email, subject: 'Verify Your PassGo Account', html: emailHtml })
            .catch(err => console.error('Email Send Error (Async):', err));

        res.status(201).json({
            message: 'Registration successful. Please verify your email.',
            user: { id: newUser.id, name, email, role: 'student', is_verified: false }
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({
            message: error.message || 'Unknown error',
            code: error.code || ''
        });
    }
};

export const verifyEmail = async (req, res) => {
    const { token, email } = req.body;

    try {
        if (!token) return res.status(400).json({ message: 'Token is required.' });

        // If email is provided, use it to narrow search, else just use token
        const query = email
            ? 'SELECT id FROM users WHERE email = $1 AND verification_token = $2'
            : 'SELECT id FROM users WHERE verification_token = $1';
        const params = email ? [email, token] : [token];

        const result = await db.query(query, params);
        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired verification token.' });
        }

        const userId = result.rows[0].id;
        await db.query('UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = $1', [userId]);

        res.status(200).json({ message: 'Email verified successfully. You can now use all features.' });

    } catch (error) {
        console.error('Verification Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const resendVerification = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) return res.status(400).json({ message: 'Email is required.' });

        const result = await db.query('SELECT name, is_verified FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = result.rows[0];
        if (user.is_verified) {
            return res.status(400).json({ message: 'Account is already verified.' });
        }

        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        await db.query('UPDATE users SET verification_token = $1 WHERE email = $2', [verificationToken, email]);

        console.log(`[VERIFICATION] New Token generated for ${email}: ${verificationToken}`);

        const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 30px; border: 1px solid #eee; border-radius: 20px; max-width: 600px; margin: 0 auto; background: #fff;">
        <h1 style="color: #131718; text-transform: uppercase; letter-spacing: 5px; text-align: center;">PASSGO</h1>
        <h2 style="text-align: center;">Your New Verification Code</h2>
        <p>Hi ${user.name},</p>
        <p>You requested a new verification code. Please use the code below to activate your account:</p>
        <div style="background: #f8f8f8; padding: 20px; font-size: 32px; font-weight: bold; letter-spacing: 12px; text-align: center; border-radius: 12px; color: #131718; border: 2px solid #131718;">
          ${verificationToken}
        </div>
        <br>
        <p>Best regards,<br>The PassGo Team</p>
      </div>
    `;

        sendEmail({ to: email, subject: 'Your PassGo Verification Code', html: emailHtml })
            .catch(err => console.error('Email Resend Error:', err));

        res.status(200).json({ message: 'Verification code resent successfully.' });

    } catch (error) {
        console.error('Resend Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
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

        if (user.role === 'student' && !user.is_verified) {
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
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
            'SELECT id, name, student_id, email, phone, role, is_active, is_verified FROM users WHERE id = $1',
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