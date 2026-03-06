import db from '../config/db.js';
import { sendEmail } from '../utils/mailer.js';

// ---- BUS MANAGEMENT ----
export const getBuses = async (req, res) => {
    try {
        const [buses] = await db.query('SELECT * FROM buses');
        res.status(200).json(buses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching buses.' });
    }
};

export const addBus = async (req, res) => {
    const { busNumber, operatorName, capacity } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        const [result] = await db.query(
            'INSERT INTO buses (bus_number, operator_name, capacity, image_url) VALUES (?, ?, ?, ?)',
            [busNumber, operatorName, capacity, imageUrl]
        );
        res.status(201).json({ message: 'Bus added', id: result.insertId, imageUrl });
    } catch (error) {
        res.status(500).json({ message: 'Error adding bus.' });
    }
};

export const deleteBus = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM buses WHERE id = ?', [id]);
        res.status(200).json({ message: 'Bus deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting bus.' });
    }
};

// ---- STUDENT MANAGEMENT ----
export const getStudents = async (req, res) => {
    try {
        const [students] = await db.query('SELECT id, name, student_id, email, phone, role, is_active FROM users WHERE role="student"');
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students.' });
    }
};

export const toggleStudentState = async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    try {
        await db.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive, id]);
        res.status(200).json({ message: `Student account ${isActive ? 'activated' : 'deactivated'}.` });
    } catch (error) {
        res.status(500).json({ message: 'Error updating student state.' });
    }
};

export const flagStudent = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.session.userId;

    try {
        await db.query('UPDATE users SET is_active = false WHERE id = ?', [id]);
        await db.query('INSERT INTO flagged_users (user_id, reason, flagged_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE reason=VALUES(reason), flagged_by=VALUES(flagged_by)', [id, reason, adminId]);

        // Notify via email
        const [[user]] = await db.query('SELECT name, email FROM users WHERE id = ?', [id]);
        const emailHtml = `
      <div style="font-family: Arial; padding: 20px;">
        <h2 style="color: red;">PassGo Account Suspended</h2>
        <p>Hi ${user.name},</p>
        <p>Your PassGo account has been suspended by the Transport Administration.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Please contact the administration office immediately for assistance.</p>
      </div>
    `;
        await sendEmail({ to: user.email, subject: 'PassGo Account Suspended', html: emailHtml });

        res.status(200).json({ message: 'Student flagged and notified.' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error flagging student.' });
    }
};

// ---- NOTIFICATIONS ----
export const sendNotification = async (req, res) => {
    const { title, message, type } = req.body;
    const adminId = req.session.userId;

    try {
        await db.query(
            'INSERT INTO notifications (title, message, type, sent_by) VALUES (?, ?, ?, ?)',
            [title, message, type, adminId]
        );

        // Blast email to all active students
        const [students] = await db.query('SELECT email FROM users WHERE role="student" AND is_active=true');
        const bccList = students.map(s => s.email).join(',');

        const emailHtml = `
      <div style="font-family: Arial; padding: 20px;">
        <h2>PassGo Alert: ${title}</h2>
        <div style="padding: 15px; border-left: 4px solid #FEC29F; background-color: #f9f9f9;">
          <p>${message}</p>
        </div>
        <br><br>
        <small>This is an automated message from PassGo Administration.</small>
      </div>
    `;

        // Only send if we have students (prevents nodemailer error on empty 'to')
        if (bccList) {
            await sendEmail({ to: 'noreply@passgo.com', bcc: bccList, subject: `PassGo Update: ${title}`, html: emailHtml });
        }

        res.status(200).json({ message: 'Notification sent and logged.' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending notification.' });
    }
};

// ---- DASHBOARD STATS & EXPORTS ----
export const getDashboardStats = async (req, res) => {
    try {
        const [[{ totalBookings }]] = await db.query('SELECT COUNT(*) as totalBookings FROM bookings');
        const [[{ activePasses }]] = await db.query("SELECT COUNT(*) as activePasses FROM bookings WHERE status='active'");
        const [[{ totalRevenue }]] = await db.query('SELECT SUM(fare_paid) as totalRevenue FROM bookings');
        const [chartData] = await db.query(`
      SELECT DATE_FORMAT(booking_date, '%b %d') as date, COUNT(*) as passes 
      FROM bookings 
      GROUP BY booking_date 
      ORDER BY booking_date DESC LIMIT 7
    `);

        res.status(200).json({
            totalBookings,
            activePasses,
            totalRevenue: totalRevenue || 0,
            chartData: chartData.reverse() // Chronological for visual chart
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats.' });
    }
};
