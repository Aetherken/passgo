import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

// 1. Resend HTTPS API (Port 443) - Never blocked on Render
const sendViaResend = async ({ to, subject, html }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return null;

    try {
        console.log(`[MAIL-RESEND] Sending email via Resend HTTPS API to ${to}...`);
        const resendFrom = process.env.RESEND_FROM || 'PassGo <onboarding@resend.dev>';
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: resendFrom,
                to: [to.trim()],
                subject,
                html
            })
        });
        const data = await res.json();
        if (res.ok && data.id) {
            console.log(`[MAIL-RESEND] ✓ Sent via Resend API! ID: ${data.id}`);
            return { success: true, messageId: data.id, provider: 'Resend HTTPS API' };
        } else {
            console.error('[MAIL-RESEND] ✗ Resend API error:', data);
            return { success: false, error: data.message || JSON.stringify(data), provider: 'Resend HTTPS API' };
        }
    } catch (err) {
        console.error('[MAIL-RESEND] ✗ Resend fetch failed:', err.message);
        return { success: false, error: err.message, provider: 'Resend HTTPS API' };
    }
};

// 2. Brevo (Sendinblue) HTTPS API (Port 443) - Never blocked on Render
const sendViaBrevo = async ({ to, subject, html }) => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) return null;

    try {
        console.log(`[MAIL-BREVO] Sending email via Brevo HTTPS API to ${to}...`);
        const userEmail = process.env.EMAIL_USER || 'alanga031007@gmail.com';
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': apiKey.trim(),
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: 'PassGo', email: userEmail },
                to: [{ email: to.trim() }],
                subject,
                htmlContent: html
            })
        });
        const data = await res.json();
        if (res.ok && data.messageId) {
            console.log(`[MAIL-BREVO] ✓ Sent via Brevo API! ID: ${data.messageId}`);
            return { success: true, messageId: data.messageId, provider: 'Brevo HTTPS API' };
        } else {
            console.error('[MAIL-BREVO] ✗ Brevo API error:', data);
            return { success: false, error: data.message || JSON.stringify(data), provider: 'Brevo HTTPS API' };
        }
    } catch (err) {
        console.error('[MAIL-BREVO] ✗ Brevo fetch failed:', err.message);
        return { success: false, error: err.message, provider: 'Brevo HTTPS API' };
    }
};

// 3. Standard SMTP Transporter (Local / Unblocked Hosts)
const getTransporter = () => {
    const port = Number(process.env.EMAIL_PORT) || 465;
    const isSecure = port === 465;

    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: port,
        secure: isSecure,
        auth: {
            user: process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '',
            pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '',
        },
        connectionTimeout: 8000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
        tls: {
            rejectUnauthorized: false
        }
    });
};

export const sendEmail = async ({ to, bcc, subject, html }) => {
    // Try Brevo HTTPS API first (Allows sending to ANY email address worldwide for free)
    if (process.env.BREVO_API_KEY) {
        const brevoRes = await sendViaBrevo({ to, subject, html });
        if (brevoRes && brevoRes.success) return true;
    }

    // Try Resend HTTPS API second
    if (process.env.RESEND_API_KEY) {
        const resendRes = await sendViaResend({ to, subject, html });
        if (resendRes && resendRes.success) return true;
    }

    // Fallback to Nodemailer SMTP
    try {
        const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '';
        const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';

        if (!user || !pass) {
            console.error('[MAIL] ✗ Cannot send email: EMAIL_USER or EMAIL_PASS environment variables are missing.');
            return false;
        }

        console.log(`[MAIL] Attempting to send email via SMTP to ${to}...`);
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
        console.log(`[MAIL] ✓ Email sent successfully via SMTP to ${to}! MessageId: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`[MAIL] ✗ Failed to send email via SMTP to ${to}:`, error.message);
        return false;
    }
};

export const sendEmailDiagnostic = async ({ to, subject, html }) => {
    const result = {
        resendApiKeySet: !!process.env.RESEND_API_KEY,
        brevoApiKeySet: !!process.env.BREVO_API_KEY,
        emailUser: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 5)}...` : 'NOT SET',
        emailPassSet: !!process.env.EMAIL_PASS,
        emailHost: process.env.EMAIL_HOST || 'smtp.gmail.com',
        emailPort: process.env.EMAIL_PORT || '465',
        nodeEnv: process.env.NODE_ENV || 'not set',
        to,
        providerUsed: 'None',
        success: false,
        error: null,
        messageId: null,
    };

    if (process.env.RESEND_API_KEY) {
        result.providerUsed = 'Resend HTTPS API';
        const res = await sendViaResend({ to, subject, html });
        if (res) {
            result.success = res.success;
            result.error = res.error || null;
            result.messageId = res.messageId || null;
            return result;
        }
    }

    if (process.env.BREVO_API_KEY) {
        result.providerUsed = 'Brevo HTTPS API';
        const res = await sendViaBrevo({ to, subject, html });
        if (res) {
            result.success = res.success;
            result.error = res.error || null;
            result.messageId = res.messageId || null;
            return result;
        }
    }

    result.providerUsed = 'Nodemailer SMTP';
    try {
        const transporter = getTransporter();
        console.log('[MAIL-DIAG] Verifying SMTP connection...');
        await transporter.verify();
        result.smtpVerified = true;

        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject: subject || 'PassGo Diagnostic Test',
            html: html || '<h3>PassGo Email System is Working!</h3>',
        });

        result.success = true;
        result.messageId = info.messageId;
    } catch (error) {
        result.success = false;
        result.error = error.message;
    }

    return result;
};
