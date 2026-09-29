import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly resolve .env from server directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const getTransporter = () => {
    const port = Number(process.env.EMAIL_PORT) || 587;
    const isSecure = port === 465;

    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: port,
        secure: isSecure,
        auth: {
            user: process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '',
            pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '',
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

export const sendEmail = async ({ to, bcc, subject, html }) => {
    try {
        // Ensure env variables are re-checked
        dotenv.config({ path: path.resolve(__dirname, '../.env') });
        dotenv.config();

        const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '';
        const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';

        if (!user || !pass) {
            console.error('[MAIL] ✗ Cannot send email: EMAIL_USER or EMAIL_PASS environment variables are missing.');
            return false;
        }

        console.log(`[MAIL] Attempting to send email to ${to}...`);
        const transporter = getTransporter();

        const fromAddress = process.env.EMAIL_FROM || `PassGo <${user}>`;

        const mailOptions = {
            from: fromAddress,
            to,
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
        if (error.message.includes('535') || error.message.includes('Username and Password not accepted')) {
            console.error('  👉 [MAIL DIAGNOSTIC] Gmail SMTP Authentication Failed (535 Bad Credentials).');
            console.error('  👉 SOLUTION: Generate a new 16-character App Password at https://myaccount.google.com/apppasswords and set EMAIL_PASS in server/.env & Render Environment Variables.');
        }
        return false;
    }
};
