TRUNCATE station, route, route_station, train RESTART IDENTITY CASCADE;

INSERT INTO station (station_name, city) VALUES
('Dhaka (Kamalapur)', 'Dhaka'),        -- 1
('Dhaka (Biman Bandar)', 'Dhaka'),      -- 2
('Joydebpur', 'Gazipur'),              -- 3
('Narsingdi', 'Narsingdi'),            -- 4
('Bhairab Bazar', 'Kishoreganj'),      -- 5
('Brahmanbaria', 'Brahmanbaria'),      -- 6
('Akhaura', 'Brahmanbaria'),           -- 7
('Cumilla', 'Cumilla'),                -- 8
('Laksam', 'Cumilla'),                 -- 9
('Feni', 'Feni'),                      -- 10
('Chattogram', 'Chattogram'),          -- 11
('Shaistaganj', 'Habiganj'),           -- 12
('Srimangal', 'Moulvibazar'),          -- 13
('Kulaura', 'Moulvibazar'),            -- 14
('Sylhet', 'Sylhet'),                  -- 15
('Tangail', 'Tangail'),                -- 16
('Bangabandhu Bridge East', 'Tangail'),-- 17
('Ishwardi Bypass', 'Pabna'),          -- 18
('Natore', 'Natore'),                  -- 19
('Rajshahi', 'Rajshahi'),              -- 20
('Ishwardi', 'Pabna'),                 -- 21
('Poradaha', 'Kushtia'),               -- 22
('Chuadanga', 'Chuadanga'),            -- 23
('Jashore', 'Jashore'),                -- 24
('Khulna', 'Khulna');                  -- 25


INSERT INTO route (route_id, start_station_id, end_station_id) VALUES 
-- Dhaka-Chattogram
(1, 1, 11), (2, 11, 1), (3, 1, 11), (4, 11, 1),
-- Dhaka-Sylhet
(5, 1, 15), (6, 15, 1), (7, 1, 15), (8, 15, 1),
-- Dhaka-Rajshahi
(9, 1, 20), (10, 20, 1), (11, 1, 20), (12, 20, 1),
-- Dhaka-Khulna
(13, 1, 25), (14, 25, 1), (15, 1, 25), (16, 25, 1);

INSERT INTO train (train_name, route_id) VALUES 
('Subarna Express (701)', 1), ('Subarna Express (702)', 2),
('Mahanagar Express (721)', 3), ('Mahanagar Express (722)', 4),
('Parabat Express (709)', 5), ('Parabat Express (710)', 6),
('Upaban Express (739)', 7), ('Upaban Express (740)', 8),
('Silk City (753)', 9), ('Silk City (754)', 10),
('Padma Express (759)', 11), ('Padma Express (760)', 12),
('Sundarban Express (725)', 13), ('Sundarban Express (726)', 14),
('Chitra Express (763)', 15), ('Chitra Express (764)', 16);


-- Outbound (Subarna 701: Dhaka to Chattogram)
INSERT INTO route_station (route_id, station_id, sequence_no, arrival_time, departure_time, distance_km) VALUES
(1, 1, 1, '16:30:00', '16:30:00', 0),
(1, 2, 2, '16:55:00', '17:00:00', 21),
(1, 11, 3, '21:30:00', '21:30:00', 321);

-- Inbound (Subarna 702: Chattogram to Dhaka)
INSERT INTO route_station (route_id, station_id, sequence_no, arrival_time, departure_time, distance_km) VALUES
(2, 11, 1, '07:00:00', '07:00:00', 0),
(2, 2, 2, '11:40:00', '11:45:00', 300),
(2, 1, 3, '12:20:00', '12:20:00', 321);

-- Outbound (Mahanagar 721)
INSERT INTO route_station (route_id, station_id, sequence_no, arrival_time, departure_time, distance_km) VALUES
(3, 1, 1, '21:00:00', '21:00:00', 0),
(3, 2, 2, '21:25:00', '21:30:00', 21),
(3, 4, 3, '22:10:00', '22:12:00', 68),
(3, 5, 4, '22:45:00', '22:50:00', 85),
(3, 6, 5, '23:25:00', '23:28:00', 115),
(3, 7, 6, '23:50:00', '23:55:00', 130),
(3, 8, 7, '00:50:00', '00:55:00', 160),
(3, 9, 8, '01:25:00', '01:30:00', 185),
(3, 10, 9, '02:15:00', '02:20:00', 250),
(3, 11, 10, '04:20:00', '04:20:00', 321);

-- Inbound (Mahanagar 722)
INSERT INTO route_station (route_id, station_id, sequence_no, arrival_time, departure_time, distance_km) VALUES
(4, 11, 1, '12:30:00', '12:30:00', 0),
(4, 10, 2, '14:05:00', '14:10:00', 71),
(4, 9, 3, '14:55:00', '15:00:00', 136),
(4, 8, 4, '15:25:00', '15:30:00', 161),
(4, 7, 5, '16:20:00', '16:25:00', 191),
(4, 6, 6, '16:45:00', '16:48:00', 206),
(4, 5, 7, '17:20:00', '17:25:00', 236),
(4, 4, 8, '18:00:00', '18:02:00', 253),
(4, 2, 9, '18:55:00', '19:00:00', 300),
(4, 1, 10, '19:40:00', '19:40:00', 321);


-- Outbound (Parabat 709)
INSERT INTO route_station (route_id, station_id, sequence_no, arrival_time, departure_time, distance_km) VALUES
(5, 1, 1, '06:20:00', '06:20:00', 0),
(5, 2, 2, '06:45:00', '06:50:00', 21),
(5, 5, 3, '07:55:00', '08:00:00', 85),
(5, 7, 4, '08:35:00', '08:40:00', 130),
(5, 12, 5, '10:05:00', '10:10:00', 180),
(5, 13, 6, '10:55:00', '11:00:00', 225),
(5, 14, 7, '11:45:00', '11:50:00', 260),
(5, 15, 8, '13:00:00', '13:00:00', 315);

-- Inbound (Parabat 710)
INSERT INTO route_station (route_id, station_id, sequence_no, arrival_time, departure_time, distance_km) VALUES
(6, 15, 1, '15:45:00', '15:45:00', 0),
(6, 14, 2, '16:45:00', '16:50:00', 55),
(6, 13, 3, '17:40:00', '17:45:00', 90),
(6, 12, 4, '18:30:00', '18:35:00', 135),
(6, 7, 5, '20:10:00', '20:15:00', 185),
(6, 5, 6, '20:55:00', '21:00:00', 230),
(6, 2, 7, '22:10:00', '22:15:00', 294),
(6, 1, 8, '22:50:00', '22:50:00', 315);

-- Outbound (Upaban 739: Dhaka to Sylhet)
INSERT INTO route_station (route_id, station_id, sequence_no, arrival_time, departure_time, distance_km) VALUES
(7, 1, 1, '20:30:00', '20:30:00', 0),
(7, 2, 2, '21:00:00', '21:05:00', 21),
(7, 4, 3, '21:50:00', '21:52:00', 68),
(7, 5, 4, '22:20:00', '22:25:00', 85),
(7, 6, 5, '23:05:00', '23:08:00', 115),
(7, 7, 6, '23:35:00', '23:45:00', 130),
(7, 12, 7, '01:10:00', '01:15:00', 180),
(7, 13, 8, '02:05:00', '02:10:00', 225),
(7, 14, 9, '03:10:00', '03:15:00', 260),
(7, 15, 10, '04:30:00', '04:30:00', 315);

-- Inbound (Upaban 740: Sylhet to Dhaka)
INSERT INTO route_station (route_id, station_id, sequence_no, arrival_time, departure_time, distance_km) VALUES
(8, 15, 1, '23:30:00', '23:30:00', 0),
(8, 14, 2, '00:35:00', '00:40:00', 55),
(8, 13, 3, '01:25:00', '01:30:00', 90),
(8, 12, 4, '02:15:00', '02:20:00', 135),
(8, 7, 5, '03:50:00', '04:00:00', 185),
(8, 6, 6, '04:25:00', '04:28:00', 200),
(8, 5, 7, '05:10:00', '05:15:00', 230),
(8, 2, 8, '06:20:00', '06:25:00', 294),
(8, 1, 9, '07:05:00', '07:05:00', 315);

-- Outbound (Silk City 753: Dhaka to Rajshahi)
INSERT INTO route_station (route_id, station_id, sequence_no, arrival_time, departure_time, distance_km) VALUES
(9, 1, 1, '14:40:00', '14:40:00', 0),
(9, 2, 2, '15:05:00', '15:10:00', 21),
(9, 3, 3, '15:45:00', '15:50:00', 40),
(9, 16, 4, '16:45:00', '16:50:00', 95),
(9, 17, 5, '17:20:00', '17:25:00', 115),
(9, 18, 6, '19:15:00', '19:20:00', 210),
(9, 19, 7, '19:55:00', '20:00:00', 225),
(9, 20, 8, '20:50:00', '20:50:00', 255);

-- Inbound (Silk City 754: Rajshahi to Dhaka)
INSERT INTO route_station (route_id, station_id, sequence_no, arrival_time, departure_time, distance_km) VALUES
(10, 20, 1, '07:40:00', '07:40:00', 0),
(10, 19, 2, '08:25:00', '08:30:00', 30),
(10, 18, 3, '09:05:00', '09:10:00', 45),
(10, 17, 4, '10:55:00', '11:00:00', 140),
(10, 16, 5, '11:40:00', '11:45:00', 160),
(10, 3, 6, '12:40:00', '12:45:00', 215),
(10, 2, 7, '13:20:00', '13:25:00', 234),
(10, 1, 8, '14:00:00', '14:00:00', 255);

-- Outbound (Padma 759)
INSERT INTO route_station (route_id, station_id, sequence_no, arrival_time, departure_time, distance_km) VALUES
(11, 1, 1, '23:00:00', '23:00:00', 0),
(11, 2, 2, '23:25:00', '23:30:00', 21),
(11, 3, 3, '00:10:00', '00:15:00', 40),
(11, 16, 4, '01:05:00', '01:10:00', 95),
(11, 17, 5, '01:40:00', '01:45:00', 115),
(11, 18, 6, '03:10:00', '03:15:00', 210),
(11, 19, 7, '03:45:00', '03:50:00', 225),
(11, 20, 8, '04:30:00', '04:30:00', 255);

-- Inbound (Padma 760)
INSERT INTO route_station (route_id, station_id, sequence_no, arrival_time, departure_time, distance_km) VALUES
(12, 20, 1, '16:00:00', '16:00:00', 0),
(12, 19, 2, '16:40:00', '16:45:00', 30),
(12, 18, 3, '17:15:00', '17:20:00', 45),
(12, 17, 4, '19:10:00', '19:15:00', 140),
(12, 16, 5, '19:50:00', '19:55:00', 160),
(12, 3, 6, '20:55:00', '21:00:00', 215),
(12, 2, 7, '21:35:00', '21:40:00', 234),
(12, 1, 8, '22:15:00', '22:15:00', 255);

-- Outbound (Sundarban 725)
INSERT INTO route_station (route_id, station_id, sequence_no, arrival_time, departure_time, distance_km) VALUES
(13, 1, 1, '08:15:00', '08:15:00', 0),
(13, 2, 2, '08:40:00', '08:45:00', 21),
(13, 3, 3, '09:30:00', '09:35:00', 40),
(13, 16, 4, '10:40:00', '10:45:00', 95),
(13, 17, 5, '11:15:00', '11:20:00', 115),
(13, 21, 6, '12:50:00', '13:00:00', 205),
(13, 22, 7, '13:30:00', '13:35:00', 230),
(13, 23, 8, '14:05:00', '14:10:00', 260),
(13, 24, 9, '15:10:00', '15:20:00', 340),
(13, 25, 10, '16:30:00', '16:30:00', 412);

-- Inbound (Sundarban 726)
INSERT INTO route_station (route_id, station_id, sequence_no, arrival_time, departure_time, distance_km) VALUES
(14, 25, 1, '21:45:00', '21:45:00', 0),
(14, 24, 2, '22:50:00', '23:00:00', 72),
(14, 23, 3, '00:05:00', '00:10:00', 152),
(14, 22, 4, '00:40:00', '00:45:00', 182),
(14, 21, 5, '01:15:00', '01:25:00', 207),
(14, 17, 6, '03:30:00', '03:35:00', 297),
(14, 16, 7, '04:10:00', '04:15:00', 317),
(14, 3, 8, '05:30:00', '05:35:00', 372),
(14, 2, 9, '06:10:00', '06:15:00', 391),
(14, 1, 10, '06:50:00', '06:50:00', 412);

DO $$
DECLARE
    t_record RECORD;
    c_id INT;
    c_name TEXT;
    c_type TEXT;
    c_seats INT;
    s_num INT;
    is_inbound BOOLEAN;
    dir TEXT;
BEGIN
    -- Loop through all existing trains (16 trains total)
    FOR t_record IN SELECT train_id FROM train ORDER BY train_id LOOP
        
        -- Logic: Even train_ids are considered return trips
        is_inbound := (t_record.train_id % 2 = 0);

        -- Inner loop for 5 coaches: KA, KHA, GA, GHA, UMA
        FOR coach_index IN 1..5 LOOP
            
            -- Assign Name and Type based on index (Matching your check constraint)
            CASE coach_index
                WHEN 1 THEN 
                    c_name := 'KA'; 
                    -- Trains 1-8 get s_chair, 9-16 get shovan
                    c_type := CASE WHEN t_record.train_id <= 8 THEN 's_chair' ELSE 'shovan' END;
                    c_seats := 60;
                WHEN 2 THEN 
                    c_name := 'KHA'; c_type := 's_chair'; c_seats := 60;
                WHEN 3 THEN 
                    c_name := 'GA';  c_type := 'snigdha'; c_seats := 60;
                WHEN 4 THEN 
                    c_name := 'GHA'; c_type := 'f_seat';  c_seats := 33;
                WHEN 5 THEN 
                    c_name := 'UMA'; c_type := 'ac_s';    c_seats := 33;
            END CASE;

            -- Insert the coach
            INSERT INTO coach (train_id, coach_name, seats, type)
            VALUES (t_record.train_id, c_name, c_seats, c_type)
            RETURNING coach_id INTO c_id;

            -- Insert Seats for this coach
            FOR s_num IN 1..c_seats LOOP
                -- Direction Logic
                -- Outbound: 1st half Forward, 2nd half Backward
                -- Inbound: 1st half Backward, 2nd half Forward
                IF NOT is_inbound THEN
                    dir := CASE WHEN s_num <= (c_seats / 2) THEN 'Forward' ELSE 'Backward' END;
                ELSE
                    dir := CASE WHEN s_num <= (c_seats / 2) THEN 'Backward' ELSE 'Forward' END;
                END IF;

                INSERT INTO seat (coach_id, seat_number, direction, reservation_status)
                VALUES (c_id, c_name || '-' || s_num, dir, 'available');
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

ALTER TABLE schedule ADD CONSTRAINT unique_train_schedule UNIQUE (train_id, date);
INSERT INTO schedule (train_id, route_id, date, starting_time, station_id)
SELECT t.train_id, t.route_id, d.scheduled_date::date, rs.departure_time, rs.station_id
FROM train t
JOIN route_station rs ON rs.route_id = t.route_id AND rs.sequence_no = 1
CROSS JOIN generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', INTERVAL '1 day') AS d(scheduled_date)
WHERE trim(to_char(d.scheduled_date, 'Day')) != t.off_day OR t.off_day IS NULL;

INSERT INTO train_tracking (schedule_id, station_id, expected_time, status)
SELECT 
    s.schedule_id,
    rs.station_id,
    (s.date + rs.arrival_time)::timestamp AS expected_time,
    'on_time'
FROM schedule s
JOIN route_station rs ON s.route_id = rs.route_id;
