import bcrypt from 'bcrypt';
import db from '../config/db.js';
import { sendEmail } from '../utils/mailer.js';

// Helper to generate a 6-digit OTP code
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const register = async (req, res) => {
    const { name, studentId, phone, email, password } = req.body;

    try {
        if (!name || !studentId || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Validate Student ID format: vml(23-25)(cc,ad,cse,csd,csb,me,ce,ee,eee)(001-999)
        const STUDENT_ID_REGEX = /^vml(23|24|25)(cc|ad|cse|csd|csb|me|ce|ee|eee)[0-9]{3}$/i;
        if (!STUDENT_ID_REGEX.test(studentId.trim())) {
            return res.status(400).json({
                message: 'Invalid Student ID format. Must match format vml[23-25][branch][001-999] (e.g., vml25cc008).'
            });
        }

        const existing = await db.query(
            'SELECT id FROM users WHERE email = $1 OR student_id = $2',
            [email.toLowerCase().trim(), studentId.trim()]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ message: 'User with this email or Student ID already exists.' });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        const verificationToken = generateOTP();

        const result = await db.query(
            'INSERT INTO users (name, student_id, phone, email, password_hash, is_verified, verification_token) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [name, studentId.trim(), phone || null, email.toLowerCase().trim(), passwordHash, false, verificationToken]
        );

        const newUser = result.rows[0];
        req.session.userId = newUser.id;

        const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; rounded: 12px; background-color: #ffffff;">
        <h2 style="color: #131718; text-align: center;">Welcome to PassGo!</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Thank you for registering with PassGo. Please verify your email address using the 6-digit verification code below:</p>
        <div style="background-color: #f4f4f4; padding: 16px; text-align: center; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #131718; margin: 20px 0;">
          ${verificationToken}
        </div>
        <p style="font-size: 14px; color: #666666;">Enter this code on the email verification page to complete your registration.</p>
        <p><strong>Student ID:</strong> ${studentId.trim()}</p>
        <br>
        <p style="font-size: 12px; color: #888888;">Best regards,<br>The PassGo Team</p>
      </div>
    `;

        // Send verification email (non-blocking so API doesn't hang on slow SMTP)
        sendEmail({ to: email.toLowerCase().trim(), subject: `PassGo Email Verification Code: ${verificationToken}`, html: emailHtml })
            .then(ok => console.log(`[AUTH] Verification email to ${email}: ${ok ? 'SENT' : 'FAILED'}`))
            .catch(err => console.error('[AUTH] Verification email error:', err.message));

        res.status(201).json({
            message: 'Registration successful. Verification code sent to your email.',
            user: { id: newUser.id, name, email: email.toLowerCase().trim(), role: 'student', is_verified: false },
            verificationRequired: true
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({
            message: error.message || 'Unknown error',
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

        const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
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
            user: {
                id: user.id,
                name: user.name,
                student_id: user.student_id,
                email: user.email,
                role: user.role,
                is_verified: user.is_verified ?? false
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const verifyEmail = async (req, res) => {
    const { token, email } = req.body;
    const sessionUserId = req.user?.id || req.session?.userId;

    try {
        if (!token) {
            return res.status(400).json({ message: 'Verification code is required.' });
        }

        let userQuery;
        let queryParams;

        if (email) {
            userQuery = 'SELECT * FROM users WHERE email = $1';
            queryParams = [email.toLowerCase().trim()];
        } else if (sessionUserId) {
            userQuery = 'SELECT * FROM users WHERE id = $1';
            queryParams = [sessionUserId];
        } else {
            return res.status(400).json({ message: 'Email or active session is required.' });
        }

        const result = await db.query(userQuery, queryParams);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User account not found.' });
        }

        const user = result.rows[0];

        if (user.is_verified) {
            return res.status(200).json({
                message: 'Your email is already verified.',
                user: { id: user.id, name: user.name, email: user.email, role: user.role, is_verified: true }
            });
        }

        if (!user.verification_token || user.verification_token.trim() !== token.toString().trim()) {
            return res.status(400).json({ message: 'Invalid or expired verification code.' });
        }

        // Mark verified and clear verification token
        await db.query(
            'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = $1',
            [user.id]
        );

        res.status(200).json({
            message: 'Email verified successfully!',
            user: {
                id: user.id,
                name: user.name,
                student_id: user.student_id,
                email: user.email,
                role: user.role,
                is_verified: true
            }
        });

    } catch (error) {
        console.error('Verify Email Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const resendVerification = async (req, res) => {
    const { email } = req.body;
    const sessionUserId = req.user?.id || req.session?.userId;

    try {
        let userQuery;
        let queryParams;

        if (email) {
            userQuery = 'SELECT * FROM users WHERE email = $1';
            queryParams = [email.toLowerCase().trim()];
        } else if (sessionUserId) {
            userQuery = 'SELECT * FROM users WHERE id = $1';
            queryParams = [sessionUserId];
        } else {
            return res.status(400).json({ message: 'Email address is required to resend verification code.' });
        }

        const result = await db.query(userQuery, queryParams);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User account not found.' });
        }

        const user = result.rows[0];

        if (user.is_verified) {
            return res.status(400).json({ message: 'Email is already verified.' });
        }

        const newCode = generateOTP();

        await db.query(
            'UPDATE users SET verification_token = $1 WHERE id = $2',
            [newCode, user.id]
        );

        const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; rounded: 12px; background-color: #ffffff;">
        <h2 style="color: #131718; text-align: center;">New PassGo Verification Code</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Here is your new 6-digit email verification code:</p>
        <div style="background-color: #f4f4f4; padding: 16px; text-align: center; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #131718; margin: 20px 0;">
          ${newCode}
        </div>
        <p style="font-size: 14px; color: #666666;">Enter this code on the email verification page to verify your account.</p>
        <br>
        <p style="font-size: 12px; color: #888888;">Best regards,<br>The PassGo Team</p>
      </div>
    `;

        sendEmail({ to: user.email, subject: `New PassGo Verification Code: ${newCode}`, html: emailHtml })
            .then(ok => console.log(`[AUTH] Resend verification to ${user.email}: ${ok ? 'SENT' : 'FAILED'}`))
            .catch(err => console.error('[AUTH] Resend verification error:', err.message));

        res.status(200).json({ message: 'A new verification code has been sent to your email.' });

    } catch (error) {
        console.error('Resend Verification Error:', error);
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
    const userId = req.user?.id || req.session?.userId;
    if (!userId) {
        return res.status(401).json({ message: 'Not authenticated.' });
    }

    try {
        const result = await db.query(
            'SELECT id, name, student_id, email, phone, role, is_verified, is_active FROM users WHERE id = $1 OR CAST(id AS TEXT) = CAST($1 AS TEXT)',
            [userId]
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