import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Only load .env file in development — in production, use system env vars (Render/Railway)
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const getTransporter = () => {
    const port = Number(process.env.EMAIL_PORT) || 465;
    const isSecure = port === 465;

    console.log(`[MAIL] Creating transporter: host=${process.env.EMAIL_HOST || 'smtp.gmail.com'}, port=${port}, secure=${isSecure}`);

    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: port,
        secure: isSecure,
        auth: {
            user: process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '',
            pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '',
        },
        connectionTimeout: 10000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
        tls: {
            rejectUnauthorized: false
        }
    });
};

export const sendEmail = async ({ to, bcc, subject, html }) => {
    try {
        const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '';
        const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';

        if (!user || !pass) {
            console.error('[MAIL] ✗ Cannot send email: EMAIL_USER or EMAIL_PASS environment variables are missing.');
            console.error('[MAIL]   EMAIL_USER set:', !!user, '| EMAIL_PASS set:', !!pass);
            return false;
        }

        console.log(`[MAIL] Attempting to send email to ${to} from ${user}...`);
        const transporter = getTransporter();

        const rawFrom = process.env.EMAIL_FROM ? process.env.EMAIL_FROM.trim().replace(/^["']|["']$/g, '') : '';
        const fromAddress = rawFrom || `PassGo <${user}>`;

        const mailOptions = {
            from: fromAddress,
            to: (to || '').trim(),
            subject,
            html,
        };

        if (bcc) {
            mailOptions.bcc = bcc;
        }

        const info = await transporter.sendMail(mailOptions);
        console.log(`[MAIL] ✓ Email sent successfully to ${to}! MessageId: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`[MAIL] ✗ Failed to send email to ${to}:`, error.message);
        return false;
    }
};

// Diagnostic function - returns detailed result for the test endpoint
export const sendEmailDiagnostic = async ({ to, subject, html }) => {
    const result = {
        emailUser: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 5)}...` : 'NOT SET',
        emailPassSet: !!process.env.EMAIL_PASS,
        emailPassLength: process.env.EMAIL_PASS?.length || 0,
        emailHost: process.env.EMAIL_HOST || 'smtp.gmail.com',
        emailPort: process.env.EMAIL_PORT || '465',
        nodeEnv: process.env.NODE_ENV || 'not set',
        to,
        success: false,
        error: null,
        messageId: null,
        smtpVerified: false,
    };

    try {
        const transporter = getTransporter();

        console.log('[MAIL-DIAG] Verifying SMTP connection...');
        await transporter.verify();
        result.smtpVerified = true;
        console.log('[MAIL-DIAG] ✓ SMTP verified');

        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject: subject || 'PassGo Diagnostic Test',
            html: html || '<h3>PassGo Email System is Working!</h3><p>This is a diagnostic test email.</p>',
        });

        result.success = true;
        result.messageId = info.messageId;
        console.log('[MAIL-DIAG] ✓ Email sent:', info.messageId);
    } catch (error) {
        result.success = false;
        result.error = error.message;
        console.error('[MAIL-DIAG] ✗ Failed:', error.message);
    }

    return result;
};
