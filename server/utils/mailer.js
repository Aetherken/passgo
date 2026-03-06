import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // Use TLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async ({ to, subject, html }) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"PassGo Admin" <noreply@passgo.com>',
            to,
            subject,
            html,
        });
        console.log(`Email sent: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};
