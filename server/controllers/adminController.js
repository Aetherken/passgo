import db from '../config/db.js';
import { sendEmail } from '../utils/mailer.js';

// ---- BUS MANAGEMENT ----
export const getBuses = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM buses');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addBus = async (req, res) => {
    const { busNumber, operatorName, capacity, seatsBooked } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        const result = await db.query(
            'INSERT INTO buses (bus_number, operator_name, capacity, seats_booked, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [busNumber, operatorName, capacity, seatsBooked || 0, imageUrl]
        );
        res.status(201).json({ message: 'Bus added', id: result.rows[0].id, imageUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateBus = async (req, res) => {
    const { id } = req.params;
    const { busNumber, operatorName, capacity, seatsBooked } = req.body;
    try {
        await db.query(
            'UPDATE buses SET bus_number = $1, operator_name = $2, capacity = $3, seats_booked = $4 WHERE id = $5',
            [busNumber, operatorName, capacity, seatsBooked, id]
        );
        res.status(200).json({ message: 'Bus updated successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteBus = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM buses WHERE id = $1', [id]);
        res.status(200).json({ message: 'Bus deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ---- TIME SLOT MANAGEMENT ----
export const getTimeSlots = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT ts.id, ts.departure_time, ts.arrival_time, ts.available_seats,
                   ts.route_id, ts.bus_id,
                   r.origin, c.name as destination,
                   b.bus_number
            FROM time_slots ts
            JOIN routes r ON ts.route_id = r.id
            JOIN cities c ON r.destination_id = c.id
            JOIN buses b ON ts.bus_id = b.id
            ORDER BY c.name ASC, ts.departure_time ASC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateTimeSlot = async (req, res) => {
    const { id } = req.params;
    const { departureTime, arrivalTime, availableSeats } = req.body;
    try {
        await db.query(
            'UPDATE time_slots SET departure_time = $1, arrival_time = $2, available_seats = $3 WHERE id = $4',
            [departureTime, arrivalTime, availableSeats, id]
        );
        res.status(200).json({ message: 'Time slot updated successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ---- STUDENT MANAGEMENT ----
export const getStudents = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, name, student_id, email, phone, role, is_active FROM users WHERE role = $1',
            ['student']
        );
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const toggleStudentState = async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    try {
        await db.query('UPDATE users SET is_active = $1 WHERE id = $2', [isActive, id]);
        res.status(200).json({ message: `Student account ${isActive ? 'activated' : 'deactivated'}.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const flagStudent = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.session.userId;

    try {
        await db.query('UPDATE users SET is_active = false WHERE id = $1', [id]);
        await db.query(
            'INSERT INTO flagged_users (user_id, reason, flagged_by) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET reason = $2, flagged_by = $3',
            [id, reason, adminId]
        );

        const userResult = await db.query('SELECT name, email FROM users WHERE id = $1', [id]);
        const user = userResult.rows[0];
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
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// ---- NOTIFICATIONS ----
export const sendNotification = async (req, res) => {
    const { title, message, type } = req.body;
    const adminId = req.session.userId;

    try {
        await db.query(
            'INSERT INTO notifications (title, message, type, sent_by) VALUES ($1, $2, $3, $4)',
            [title, message, type, adminId]
        );

        const studentsResult = await db.query(
            'SELECT email FROM users WHERE role = $1 AND is_active = true',
            ['student']
        );
        const bccList = studentsResult.rows.map(s => s.email).join(',');

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

        if (bccList) {
            await sendEmail({ to: 'noreply@passgo.com', bcc: bccList, subject: `PassGo Update: ${title}`, html: emailHtml });
        }

        res.status(200).json({ message: 'Notification sent and logged.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ---- DASHBOARD STATS ----
export const getDashboardStats = async (req, res) => {
    try {
        const totalBookingsResult = await db.query('SELECT COUNT(*) as total FROM bookings');
        const activePassesResult = await db.query("SELECT COUNT(*) as total FROM bookings WHERE status = 'active'");
        const totalRevenueResult = await db.query('SELECT COALESCE(SUM(fare_paid), 0) as total FROM bookings');
        const chartDataResult = await db.query(`
            SELECT TO_CHAR(booking_date, 'Mon DD') as date, COUNT(*) as passes 
            FROM bookings 
            GROUP BY booking_date 
            ORDER BY booking_date DESC LIMIT 7
        `);

        const stats = {
            totalBookings: totalBookingsResult.rows[0]?.total || 0,
            activePasses: activePassesResult.rows[0]?.total || 0,
            totalRevenue: totalRevenueResult.rows[0]?.total || 0,
            chartData: (chartDataResult.rows || []).reverse()
        };

        return res.status(200).json(stats);
    } catch (error) {
        console.error('Stats Crash:', error);
        return res.status(500).json({ message: 'Internal stats error' });
    }
};
