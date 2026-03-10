import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
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
        console.log(`Attempting to send email to ${to}...`);
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM?.replace(/^"(.*)"$/, '$1') || '"PassGo Admin" <noreply@passgo.com>',
            to,
            subject,
            html,
        });
        console.log(`✓ Email sent successfully to ${to}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`✗ Error sending email to ${to}:`, error.message);
        return false;
    }
};
