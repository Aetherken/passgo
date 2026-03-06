-- passgo_seed.sql
USE passgo;

-- 1. Insert Super Admin
-- Password is 'admin123' (bcrypt hash)
INSERT INTO users (name, email, password_hash, role) 
VALUES ('Super Admin', 'admin@passgo.com', '$2b$10$wN358Xb.v3Z2N7JqZ.y7/Ofi/y1Z8G3iM2C7e8t9PzM3/4Q9f.Z/K', 'superadmin');

-- 2. Insert Cities
INSERT INTO cities (name, description) VALUES
('Kannur', 'Major coastal city and district headquarters.'),
('Thalassery', 'Known for its bakery industry and heritage.'),
('Payyanur', 'Cultural hub in northern Kannur.'),
('Iritty', 'Hilly town with spice plantations.'),
('Mattannur', 'Home to the Kannur International Airport.'),
('Taliparamba', 'Major educational and commercial center.');

-- 3. Insert Buses
INSERT INTO buses (bus_number, operator_name, capacity) VALUES
('KL-58-A-1111', 'VJEC Transport', 50),
('KL-58-A-2222', 'VJEC Transport', 50),
('KL-58-A-3333', 'VJEC Transport', 50),
('KL-58-B-4444', 'VJEC Transport', 40),
('KL-58-B-5555', 'VJEC Transport', 40),
('KL-58-B-6666', 'VJEC Transport', 40);

-- 4. Insert Routes (From VJEC to Cities)
-- Origin defaults to 'Vimal Jyothi Engineering College'
INSERT INTO routes (destination_id, distance_km, estimated_duration_mins) VALUES
(1, 45.5, 90), -- to Kannur
(2, 52.0, 100), -- to Thalassery
(3, 38.0, 75), -- to Payyanur
(4, 25.0, 50), -- to Iritty
(5, 30.0, 60), -- to Mattannur
(6, 35.0, 70); -- to Taliparamba

-- 5. Insert Time Slots (Morning/Evening trips)
-- Assuming route IDs map perfectly 1 to 6 as inserted above
-- Assuming bus IDs map perfectamente 1 to 6 as inserted above
INSERT INTO time_slots (route_id, bus_id, departure_time, arrival_time, available_seats) VALUES
-- Kannur Route (Route 1)
(1, 1, '07:30:00', '09:00:00', 50),
(1, 1, '16:30:00', '18:00:00', 50),
-- Thalassery Route (Route 2)
(2, 2, '07:15:00', '08:55:00', 50),
(2, 2, '16:40:00', '18:20:00', 50),
-- Payyanur Route (Route 3)
(3, 3, '07:45:00', '09:00:00', 50),
(3, 3, '16:30:00', '17:45:00', 50),
-- Iritty Route (Route 4)
(4, 4, '08:10:00', '09:00:00', 40),
(4, 4, '16:30:00', '17:20:00', 40),
-- Mattannur Route (Route 5)
(5, 5, '08:00:00', '09:00:00', 40),
(5, 5, '16:30:00', '17:30:00', 40),
-- Taliparamba Route (Route 6)
(6, 6, '07:50:00', '09:00:00', 40),
(6, 6, '16:30:00', '17:40:00', 40);

-- 6. Insert Fare Config
INSERT INTO fare_config (flat_fare, updated_by) VALUES (25.00, 1);
