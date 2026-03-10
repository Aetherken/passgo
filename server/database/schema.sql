-- passgo_schema.sql (PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  student_id VARCHAR(50) UNIQUE,
  phone VARCHAR(20),
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'admin', 'superadmin', 'driver')),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS buses (
  id SERIAL PRIMARY KEY,
  bus_number VARCHAR(50) UNIQUE NOT NULL,
  operator_name VARCHAR(100) NOT NULL,
  capacity INT NOT NULL,
  image_url VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routes (
  id SERIAL PRIMARY KEY,
  origin VARCHAR(100) NOT NULL DEFAULT 'Vimal Jyothi Engineering College',
  destination_id INT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  distance_km DECIMAL(5,2),
  estimated_duration_mins INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS time_slots (
  id SERIAL PRIMARY KEY,
  route_id INT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  bus_id INT NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  available_seats INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fare_config (
  id SERIAL PRIMARY KEY,
  flat_fare DECIMAL(10,2) NOT NULL DEFAULT 25.00,
  updated_by INT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  time_slot_id INT NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  fare_paid DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(10) DEFAULT 'upi' CHECK (payment_method IN ('card', 'upi')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'cancelled')),
  qr_code_token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'announcement' CHECK (type IN ('announcement', 'delay', 'maintenance')),
  sent_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flagged_users (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  flagged_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
