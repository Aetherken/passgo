import db from '../config/db.js';
import { sendEmail } from '../utils/mailer.js';
import crypto from 'crypto';

export const getCities = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM cities ORDER BY name ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getRoutes = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT r.id, r.origin, r.distance_km, r.estimated_duration_mins, c.name as destination 
            FROM routes r 
            JOIN cities c ON r.destination_id = c.id
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getSlotsByRoute = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`
            SELECT ts.id, ts.departure_time, ts.arrival_time, ts.available_seats, 
                   b.bus_number, b.operator_name, b.capacity
            FROM time_slots ts
            JOIN buses b ON ts.bus_id = b.id
            WHERE ts.route_id = $1 AND b.status = 'active'
            ORDER BY ts.departure_time ASC
        `, [id]);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createBooking = async (req, res) => {
    const { timeSlotId, bookingDate, paymentMethod } = req.body;
    const userId = req.session.userId;

    try {
        const slotResult = await db.query('SELECT available_seats FROM time_slots WHERE id = $1', [timeSlotId]);
        if (slotResult.rows.length === 0 || slotResult.rows[0].available_seats <= 0) {
            return res.status(400).json({ message: 'No seats available for this slot.' });
        }

        const fareResult = await db.query('SELECT flat_fare FROM fare_config ORDER BY id DESC LIMIT 1');
        const farePaid = fareResult.rows.length > 0 ? fareResult.rows[0].flat_fare : 25.00;

        const qrToken = crypto.randomUUID();

        // Safe insertion with returning id
        const bookingResult = await db.query(
            'INSERT INTO bookings (user_id, time_slot_id, booking_date, fare_paid, payment_method, qr_code_token) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [userId, timeSlotId, bookingDate, farePaid || 25, paymentMethod || 'upi', qrToken]
        );

        // Decrement seats
        await db.query('UPDATE time_slots SET available_seats = available_seats - 1 WHERE id = $1', [timeSlotId]);

        // Fetch user and route info for email & response
        const userResult = await db.query('SELECT name, student_id, email FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];

        const routeResult = await db.query(`
            SELECT r.origin, c.name as destination, ts.departure_time, ts.arrival_time, b.bus_number 
            FROM time_slots ts 
            JOIN routes r ON ts.route_id = r.id 
            JOIN cities c ON r.destination_id = c.id
            JOIN buses b ON ts.bus_id = b.id
            WHERE ts.id = $1
        `, [timeSlotId]);
        const routeDetails = routeResult.rows[0];

        const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Your PassGo Ticket is Confirmed!</h2>
        <p>Hi ${user?.name || 'Student'},</p>
        <ul>
          <li><strong>Student ID:</strong> ${user?.student_id || 'N/A'}</li>
          <li><strong>From:</strong> ${routeDetails?.origin || 'VJEC'}</li>
          <li><strong>To:</strong> ${routeDetails?.destination || 'Destination'}</li>
          <li><strong>Date:</strong> ${bookingDate}</li>
          <li><strong>Time:</strong> ${routeDetails?.departure_time || ''} - ${routeDetails?.arrival_time || ''}</li>
          <li><strong>Bus:</strong> ${routeDetails?.bus_number || ''}</li>
          <li><strong>Fare Paid:</strong> ₹${farePaid} (${paymentMethod.toUpperCase()})</li>
        </ul>
        <p>Your unique ticket ID is: <strong>${qrToken}</strong></p>
        <p>Have a great trip!</p>
      </div>
    `;
        // Send email
        if (user?.email) {
            sendEmail({ to: user.email, subject: 'PassGo Booking Confirmation', html: emailHtml }).catch(err => console.error('Delayed email fail:', err));
        }

        return res.status(201).json({
            message: 'Booking successful',
            bookingId: bookingResult.rows[0].id,
            qrToken,
            passengerName: user?.name || 'Student',
            studentId: user?.student_id || 'N/A'
        });

    } catch (error) {
        console.error('Booking Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getMyBookings = async (req, res) => {
    const rawUserId = req.session?.userId;
    if (!rawUserId) {
        return res.status(401).json({ message: 'Not authenticated.' });
    }

    try {
        const result = await db.query(`
            SELECT b.id, b.booking_date, b.status, b.fare_paid, b.qr_code_token, b.created_at,
                   ts.departure_time, ts.arrival_time,
                   COALESCE(r.origin, 'Vimal Jyothi Engineering College') as origin,
                   COALESCE(c.name, 'Destination') as destination,
                   COALESCE(bus.bus_number, 'VJEC Bus') as bus_number,
                   COALESCE(bus.operator_name, 'VJEC Transport') as operator_name,
                   COALESCE(u.name, 'Student') as student_name,
                   COALESCE(u.student_id, 'N/A') as student_id
            FROM bookings b
            LEFT JOIN users u ON b.user_id = u.id
            LEFT JOIN time_slots ts ON b.time_slot_id = ts.id
            LEFT JOIN routes r ON ts.route_id = r.id
            LEFT JOIN cities c ON r.destination_id = c.id
            LEFT JOIN buses bus ON ts.bus_id = bus.id
            WHERE b.user_id = $1 OR CAST(b.user_id AS TEXT) = CAST($1 AS TEXT)
            ORDER BY b.created_at DESC, b.id DESC
        `, [rawUserId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('getMyBookings error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const verifyBooking = async (req, res) => {
    const rawId = req.params.id;
    const token = (rawId || '').trim();

    try {
        const result = await db.query(`
            SELECT b.id, b.status, b.booking_date, b.fare_paid, b.qr_code_token,
                   u.name as student_name, u.student_id,
                   r.origin, c.name as destination, ts.departure_time, ts.arrival_time, bus.bus_number
            FROM bookings b
            LEFT JOIN users u ON b.user_id = u.id
            LEFT JOIN time_slots ts ON b.time_slot_id = ts.id
            LEFT JOIN routes r ON ts.route_id = r.id
            LEFT JOIN cities c ON r.destination_id = c.id
            LEFT JOIN buses bus ON ts.bus_id = bus.id
            WHERE b.qr_code_token = $1 OR CAST(b.id AS TEXT) = $1
        `, [token]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Ticket not found. Invalid pass QR code.' });
        }

        const booking = result.rows[0];

        if (booking.status !== 'active') {
            return res.status(400).json({ 
                message: `Pass has already been ${booking.status.toUpperCase()}! Cannot board again.`,
                booking 
            });
        }

        await db.query("UPDATE bookings SET status = 'used' WHERE id = $1", [booking.id]);

        const passengerInfo = booking.student_name ? `${booking.student_name}` : 'Student';
        const routeInfo = booking.destination ? `(${booking.origin} → ${booking.destination})` : '';

        return res.status(200).json({ 
            message: `Ticket verified! Passenger: ${passengerInfo} ${routeInfo}`,
            booking: { ...booking, status: 'used' }
        });
    } catch (error) {
        console.error('verifyBooking error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getFare = async (req, res) => {
    try {
        const result = await db.query('SELECT flat_fare FROM fare_config ORDER BY id DESC LIMIT 1');
        const fareValue = result.rows.length > 0 ? Number(result.rows[0].flat_fare) : 25;
        return res.status(200).json({ fare: fareValue });
    } catch (error) {
        console.error('SERVER-SIDE FARE ERROR:', error);
        return res.status(500).json({ message: 'Internal fare error', error: error.message });
    }
};