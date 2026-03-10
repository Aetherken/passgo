import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

export const sendEmail = async ({ to, subject, html }) => {
    try {
        console.log(`[MAIL] Attempting to send to ${to}...`);
        const fromEmail = process.env.EMAIL_FROM || `PassGo <${process.env.EMAIL_USER}>`;

        const info = await transporter.sendMail({
            from: fromEmail.replace(/"/g, ''), // Clean name/email
            to,
            subject,
            html,
        });
        console.log(`[MAIL] ✓ Success! ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`[MAIL] ✗ Failed to ${to}:`, error.message);
        return false;
    }
};
