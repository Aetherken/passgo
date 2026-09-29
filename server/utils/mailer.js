import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly resolve .env from server directory with override: true
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
dotenv.config({ override: true });

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
        dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
        dotenv.config({ override: true });

        const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '';
        const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';

        if (!user || !pass) {
            console.error('[MAIL] ✗ Cannot send email: EMAIL_USER or EMAIL_PASS environment variables are missing.');
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
        if (error.message.includes('535') || error.message.includes('Username and Password not accepted')) {
            console.error('  👉 [MAIL DIAGNOSTIC] Gmail SMTP Authentication Failed (535 Bad Credentials).');
            console.error('  👉 SOLUTION: Check EMAIL_PASS in server/.env & Cloud Environment Variables.');
        }
        return false;
    }
};
