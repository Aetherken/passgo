-- passgo_seed.sql (PostgreSQL)

-- 1. Insert Cities
INSERT INTO cities (name, description) VALUES
('Kannur', 'Major coastal city and district headquarters.'),
('Thalassery', 'Known for its bakery industry and heritage.'),
('Payyanur', 'Cultural hub in northern Kannur.'),
('Iritty', 'Hilly town with spice plantations.'),
('Mattannur', 'Home to the Kannur International Airport.'),
('Taliparamba', 'Major educational and commercial center.')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Buses
INSERT INTO buses (bus_number, operator_name, capacity) VALUES
('KL-58-A-1111', 'VJEC Transport', 50),
('KL-58-A-2222', 'VJEC Transport', 50),
('KL-58-A-3333', 'VJEC Transport', 50),
('KL-58-B-4444', 'VJEC Transport', 40),
('KL-58-B-5555', 'VJEC Transport', 40),
('KL-58-B-6666', 'VJEC Transport', 40)
ON CONFLICT (bus_number) DO NOTHING;

-- 3. Insert Routes (from VJEC to each city)
INSERT INTO routes (destination_id, distance_km, estimated_duration_mins)
SELECT id, dist, dur FROM (VALUES
  ('Kannur',      45.5, 90),
  ('Thalassery',  52.0, 100),
  ('Payyanur',    38.0, 75),
  ('Iritty',      25.0, 50),
  ('Mattannur',   30.0, 60),
  ('Taliparamba', 35.0, 70)
) AS v(city, dist, dur)
JOIN cities c ON c.name = v.city;

-- 4. Insert Time Slots
INSERT INTO time_slots (route_id, bus_id, departure_time, arrival_time, available_seats)
SELECT r.id, b.id, ts.dep, ts.arr, ts.seats
FROM (VALUES
  ('Kannur',      'KL-58-A-1111', '07:30:00', '09:00:00', 50),
  ('Kannur',      'KL-58-A-1111', '16:30:00', '18:00:00', 50),
  ('Thalassery',  'KL-58-A-2222', '07:15:00', '08:55:00', 50),
  ('Thalassery',  'KL-58-A-2222', '16:40:00', '18:20:00', 50),
  ('Payyanur',    'KL-58-A-3333', '07:45:00', '09:00:00', 50),
  ('Payyanur',    'KL-58-A-3333', '16:30:00', '17:45:00', 50),
  ('Iritty',      'KL-58-B-4444', '08:10:00', '09:00:00', 40),
  ('Iritty',      'KL-58-B-4444', '16:30:00', '17:20:00', 40),
  ('Mattannur',   'KL-58-B-5555', '08:00:00', '09:00:00', 40),
  ('Mattannur',   'KL-58-B-5555', '16:30:00', '17:30:00', 40),
  ('Taliparamba', 'KL-58-B-6666', '07:50:00', '09:00:00', 40),
  ('Taliparamba', 'KL-58-B-6666', '16:30:00', '17:40:00', 40)
) AS ts(city, bus, dep, arr, seats)
JOIN cities c ON c.name = ts.city
JOIN routes r ON r.destination_id = c.id
JOIN buses b ON b.bus_number = ts.bus;

-- 5. Insert Fare Config
INSERT INTO fare_config (flat_fare) VALUES (25.00);
