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
    const userId = req.user?.id || req.session?.userId;

    if (!userId) {
        return res.status(401).json({ message: 'Not authenticated. Please log in.' });
    }

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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #131718; padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 28px; letter-spacing: 4px;">PASSGO</h1>
          <p style="margin: 4px 0 0; color: #FEC29F; font-size: 14px; font-weight: bold; text-transform: uppercase;">Pass Booking Confirmed ✓</p>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 16px; color: #333333;">Hi <strong>${user?.name || 'Student'}</strong>,</p>
          <p style="color: #666666; font-size: 14px;">Your campus bus pass has been booked successfully! Below are your digital pass details:</p>
          
          <div style="background-color: #f8f9fa; border: 1px dashed #cccccc; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 6px 0; color: #666;">Student ID:</td><td style="padding: 6px 0; text-align: right; font-weight: bold; color: #131718;">${user?.student_id || 'N/A'}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">From:</td><td style="padding: 6px 0; text-align: right; font-weight: bold; color: #131718;">${routeDetails?.origin || 'VJEC'}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">To:</td><td style="padding: 6px 0; text-align: right; font-weight: bold; color: #131718;">${routeDetails?.destination || 'Destination'}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Date:</td><td style="padding: 6px 0; text-align: right; font-weight: bold; color: #131718;">${bookingDate}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Departure:</td><td style="padding: 6px 0; text-align: right; font-weight: bold; color: #131718;">${routeDetails?.departure_time ? routeDetails.departure_time.slice(0, 5) : 'N/A'}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Bus Number:</td><td style="padding: 6px 0; text-align: right; font-weight: bold; color: #131718;">${routeDetails?.bus_number || 'VJEC Bus'}</td></tr>
              <tr style="border-top: 1px solid #e0e0e0;"><td style="padding: 10px 0 0; color: #666; font-size: 16px; font-weight: bold;">Fare Paid:</td><td style="padding: 10px 0 0; text-align: right; font-size: 16px; font-weight: bold; color: #2e7d32;">₹${farePaid} (${paymentMethod ? paymentMethod.toUpperCase() : 'UPI'})</td></tr>
            </table>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <p style="font-size: 12px; color: #888888; margin-bottom: 4px;">Ticket QR / Token ID:</p>
            <code style="background-color: #131718; color: #FEC29F; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-family: monospace; display: inline-block;">${qrToken}</code>
          </div>

          <p style="font-size: 13px; color: #666666; text-align: center;">Show your QR code from your student dashboard to the driver when boarding.</p>
        </div>
        <div style="background-color: #f4f4f4; padding: 12px; text-align: center; font-size: 12px; color: #888888;">
          Thank you for choosing PassGo Campus Transport. Have a safe journey!
        </div>
      </div>
    `;
        // Send email
        if (user?.email) {
            await sendEmail({ to: user.email, subject: `PassGo Ticket Confirmation #${qrToken.slice(0, 8)}`, html: emailHtml });
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
    const rawUserId = req.user?.id || req.session?.userId;
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