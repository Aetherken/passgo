-- passgo_schema.sql

DROP DATABASE IF EXISTS passgo;
CREATE DATABASE passgo;
USE passgo;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  student_id VARCHAR(50) UNIQUE,
  phone VARCHAR(20),
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin', 'superadmin', 'driver') DEFAULT 'student',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE buses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bus_number VARCHAR(50) UNIQUE NOT NULL,
  operator_name VARCHAR(100) NOT NULL,
  capacity INT NOT NULL,
  image_url VARCHAR(255),
  status ENUM('active', 'maintenance', 'retired') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  origin VARCHAR(100) NOT NULL DEFAULT 'Vimal Jyothi Engineering College',
  destination_id INT NOT NULL,
  distance_km DECIMAL(5,2),
  estimated_duration_mins INT,
  FOREIGN KEY (destination_id) REFERENCES cities(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE time_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id INT NOT NULL,
  bus_id INT NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  available_seats INT NOT NULL,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fare_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flat_fare DECIMAL(10,2) NOT NULL DEFAULT 25.00,
  updated_by INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  time_slot_id INT NOT NULL,
  booking_date DATE NOT NULL,
  fare_paid DECIMAL(10,2) NOT NULL,
  payment_method ENUM('card', 'upi') DEFAULT 'upi',
  status ENUM('active', 'used', 'cancelled') DEFAULT 'active',
  qr_code_token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (time_slot_id) REFERENCES time_slots(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('announcement', 'delay', 'maintenance') DEFAULT 'announcement',
  sent_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE flagged_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  flagged_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (flagged_by) REFERENCES users(id) ON DELETE SET NULL
);
