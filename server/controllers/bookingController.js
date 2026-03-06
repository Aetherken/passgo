import db from '../config/db.js';
import { sendEmail } from '../utils/mailer.js';
import crypto from 'crypto';

export const getCities = async (req, res) => {
    try {
        const [cities] = await db.query('SELECT * FROM cities ORDER BY name ASC');
        res.status(200).json(cities);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cities.' });
    }
};

export const getRoutes = async (req, res) => {
    try {
        const [routes] = await db.query(`
      SELECT r.id, r.origin, r.distance_km, r.estimated_duration_mins, c.name as destination 
      FROM routes r 
      JOIN cities c ON r.destination_id = c.id
    `);
        res.status(200).json(routes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching routes.' });
    }
};

export const getSlotsByRoute = async (req, res) => {
    const { id } = req.params;
    try {
        const [slots] = await db.query(`
      SELECT ts.id, ts.departure_time, ts.arrival_time, ts.available_seats, b.bus_number, b.operator_name, b.capacity
      FROM time_slots ts
      JOIN buses b ON ts.bus_id = b.id
      WHERE ts.route_id = ? AND b.status = 'active'
      ORDER BY ts.departure_time ASC
    `, [id]);
        res.status(200).json(slots);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching time slots.' });
    }
};

export const createBooking = async (req, res) => {
    const { timeSlotId, bookingDate, paymentMethod } = req.body;
    const userId = req.session.userId;

    try {
        // Check available seats
        const [slots] = await db.query('SELECT available_seats FROM time_slots WHERE id = ?', [timeSlotId]);
        if (slots.length === 0 || slots[0].available_seats <= 0) {
            return res.status(400).json({ message: 'No seats available for this slot.' });
        }

        // Get current flat fare
        const [fare] = await db.query('SELECT flat_fare FROM fare_config ORDER BY updated_at DESC LIMIT 1');
        const farePaid = fare.length > 0 ? fare[0].flat_fare : 25.00;

        // Generate QR token
        const qrToken = crypto.randomUUID();

        // Start Transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Create booking
            const [booking] = await connection.query(
                'INSERT INTO bookings (user_id, time_slot_id, booking_date, fare_paid, payment_method, qr_code_token) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, timeSlotId, bookingDate, farePaid, paymentMethod, qrToken]
            );

            // Decrement seats
            await connection.query(
                'UPDATE time_slots SET available_seats = available_seats - 1 WHERE id = ?',
                [timeSlotId]
            );

            await connection.commit();

            // Fetch user info & booking info for email
            const [[user]] = await db.query('SELECT name, email FROM users WHERE id = ?', [userId]);
            const [[routeDetails]] = await db.query(`
        SELECT r.origin, c.name as destination, ts.departure_time, ts.arrival_time, b.bus_number 
        FROM time_slots ts 
        JOIN routes r ON ts.route_id = r.id 
        JOIN cities c ON r.destination_id = c.id
        JOIN buses b ON ts.bus_id = b.id
        WHERE ts.id = ?
      `, [timeSlotId]);

            // Send confirmation email
            const emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Your PassGo Ticket is Confirmed!</h2>
          <p>Hi ${user.name},</p>
          <p>Here are your trip details:</p>
          <ul>
            <li><strong>From:</strong> ${routeDetails.origin}</li>
            <li><strong>To:</strong> ${routeDetails.destination}</li>
            <li><strong>Date:</strong> ${bookingDate}</li>
            <li><strong>Time:</strong> ${routeDetails.departure_time} - ${routeDetails.arrival_time}</li>
            <li><strong>Bus:</strong> ${routeDetails.bus_number}</li>
            <li><strong>Fare Paid:</strong> ₹${farePaid} (${paymentMethod.toUpperCase()})</li>
          </ul>
          <p>Your unique ticket ID is: <strong>${qrToken}</strong></p>
          <p>Have a great trip!</p>
        </div>
      `;
            await sendEmail({ to: user.email, subject: 'PassGo Booking Confirmation', html: emailHtml });

            res.status(201).json({
                message: 'Booking successful',
                bookingId: booking.insertId,
                qrToken
            });

        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Booking Error:', error);
        res.status(500).json({ message: 'Failed to create booking.' });
    }
};

export const getMyBookings = async (req, res) => {
    const userId = req.session.userId;
    try {
        const [bookings] = await db.query(`
      SELECT b.id, b.booking_date, b.status, b.fare_paid, b.qr_code_token,
             ts.departure_time, ts.arrival_time,
             r.origin, c.name as destination,
             bus.bus_number, bus.operator_name
      FROM bookings b
      JOIN time_slots ts ON b.time_slot_id = ts.id
      JOIN routes r ON ts.route_id = r.id
      JOIN cities c ON r.destination_id = c.id
      JOIN buses bus ON ts.bus_id = bus.id
      WHERE b.user_id = ?
      ORDER BY b.booking_date DESC, b.created_at DESC
    `, [userId]);
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bookings.' });
    }
};

export const verifyBooking = async (req, res) => {
    const { id } = req.params; // Using QR token as ID here for scanning

    try {
        const [bookings] = await db.query('SELECT id, status FROM bookings WHERE qr_code_token = ?', [id]);

        if (bookings.length === 0) {
            return res.status(404).json({ message: 'Ticket not found.' });
        }

        if (bookings[0].status !== 'active') {
            return res.status(400).json({ message: `Ticket is already ${bookings[0].status}.` });
        }

        await db.query("UPDATE bookings SET status = 'used' WHERE id = ?", [bookings[0].id]);

        res.status(200).json({ message: 'Ticket verified successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying ticket.' });
    }
};
