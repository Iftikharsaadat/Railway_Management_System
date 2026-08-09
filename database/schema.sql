-- 1. Station
CREATE TABLE station (
    station_id SERIAL PRIMARY KEY,
    station_name VARCHAR(100) NOT NULL,
    city VARCHAR(100)
);

-- 2. Route 
CREATE TABLE route (
    route_id SERIAL PRIMARY KEY,
    start_station_id INT NOT NULL REFERENCES station(station_id),
    end_station_id INT NOT NULL REFERENCES station(station_id)
);

-- 3. RouteStation 
CREATE TABLE route_station (
    route_id INT NOT NULL REFERENCES route(route_id),
    station_id INT NOT NULL REFERENCES station(station_id),
    sequence_no INT NOT NULL,
    arrival_time TIME,
    departure_time TIME,
    PRIMARY KEY (route_id, station_id)
);

-- 4. Train

CREATE TABLE train (
    train_id SERIAL PRIMARY KEY,
    train_name VARCHAR(100) NOT NULL,
    route_id INT NOT NULL REFERENCES route(route_id)
);

-- 5. Coach

CREATE TABLE coach (
    coach_id SERIAL PRIMARY KEY,
    train_id INT NOT NULL REFERENCES train(train_id),
    coach_name VARCHAR(50) NOT NULL,
    seats INT NOT NULL
);

-- 6. Seat

CREATE TABLE seat (
    seat_id SERIAL PRIMARY KEY,
    coach_id INT NOT NULL REFERENCES coach(coach_id),
    seat_number VARCHAR(10) NOT NULL,
    type VARCHAR(50),
    direction VARCHAR(50),
    reservation_status VARCHAR(20) DEFAULT 'available'
);

-- 7. Account

CREATE TABLE account (
    account_id SERIAL PRIMARY KEY,
    nid VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- 8. Schedule

CREATE TABLE schedule (
    schedule_id SERIAL PRIMARY KEY,
    train_id INT NOT NULL REFERENCES train(train_id),
    route_id INT NOT NULL REFERENCES route(route_id),
    station_id INT NOT NULL REFERENCES station(station_id),
    date DATE NOT NULL,
    arrival_time TIME,
    starting_time TIME
);

-- 9. TrainTracking

CREATE TABLE train_tracking (
    tracking_id SERIAL PRIMARY KEY,
    schedule_id INT NOT NULL REFERENCES schedule(schedule_id),
    station_id INT NOT NULL REFERENCES station(station_id),
    expected_time TIMESTAMP,
    actual_time TIMESTAMP,
    delay_minutes INT DEFAULT 0,
    coordinates VARCHAR(100),
    status VARCHAR(50)
);

-- 10. Ticket

CREATE TABLE ticket (
    ticket_id SERIAL PRIMARY KEY,
    schedule_id INT NOT NULL REFERENCES schedule(schedule_id),
    account_id INT NOT NULL REFERENCES account(account_id),
    no_of_seats INT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending'
);

-- 11. TicketSeat

CREATE TABLE ticket_seat (
    ticket_id INT NOT NULL REFERENCES ticket(ticket_id),
    seat_id INT NOT NULL REFERENCES seat(seat_id),
    PRIMARY KEY (ticket_id, seat_id)
);

-- 12. Payment

CREATE TABLE payment (
    payment_id SERIAL PRIMARY KEY,
    ticket_id INT NOT NULL REFERENCES ticket(ticket_id),
    amount DECIMAL(10, 2) NOT NULL,
    method VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    paid_at TIMESTAMP
);

-- 13. SeatLock

CREATE TABLE seat_lock (
    lock_id SERIAL PRIMARY KEY,
    seat_id INT NOT NULL REFERENCES seat(seat_id),
    account_id INT NOT NULL REFERENCES account(account_id),
    requested_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active'
);