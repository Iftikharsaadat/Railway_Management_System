CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE station (
    station_id SERIAL PRIMARY KEY,
    station_name VARCHAR(100) NOT NULL,
    city VARCHAR(100)
);

CREATE TABLE route (
    route_id SERIAL PRIMARY KEY,
    start_station_id INT NOT NULL REFERENCES station(station_id),
    end_station_id INT NOT NULL REFERENCES station(station_id)
);

CREATE TABLE route_station (
    route_id INT NOT NULL REFERENCES route(route_id) ON DELETE CASCADE,
    station_id INT NOT NULL REFERENCES station(station_id),
    sequence_no INT NOT NULL,
    arrival_time TIME,
    departure_time TIME,
    distance_km NUMERIC(6, 2) NOT NULL DEFAULT 0,
    PRIMARY KEY (route_id, station_id)
);

CREATE TABLE train (
    train_id SERIAL PRIMARY KEY,
    train_name VARCHAR(100) NOT NULL,
    route_id INT NOT NULL REFERENCES route(route_id),
    off_day VARCHAR(20),
    CONSTRAINT uq_train_route UNIQUE (route_id)
);

CREATE TABLE coach (
    coach_id SERIAL PRIMARY KEY,
    train_id INT NOT NULL REFERENCES train(train_id),
    coach_name VARCHAR(50) NOT NULL,
    seats INT NOT NULL,
    type VARCHAR(20) NOT NULL,
    CONSTRAINT chk_coach_type CHECK (type IN (
        'shulov', 'shovan', 's_chair', 'f_seat', 'f_chair',
        'snigdha', 'f_berth', 'ac_s', 'ac_berth'
    ))
);

CREATE TABLE seat (
    seat_id SERIAL PRIMARY KEY,
    coach_id INT NOT NULL REFERENCES coach(coach_id),
    seat_number VARCHAR(10) NOT NULL,
    direction VARCHAR(50),
    reservation_status VARCHAR(20) DEFAULT 'available',
    CONSTRAINT chk_seat_reservation_status CHECK (
        reservation_status IN ('available', 'locked', 'booked')
    )
);

CREATE TABLE fare_rate (
    seat_type VARCHAR(20) PRIMARY KEY,
    rate_per_km NUMERIC(6, 2) NOT NULL,
    base_fare NUMERIC(6, 2) NOT NULL DEFAULT 0
);

CREATE TABLE account (
    account_id SERIAL PRIMARY KEY,
    nid VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone CHAR(11) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'passenger',
    CONSTRAINT account_phone_check CHECK (phone ~ '^01[0-9]{9}$'),
    CONSTRAINT chk_account_role CHECK (role IN ('passenger', 'admin', 'staff'))
);

CREATE TABLE schedule (
    schedule_id SERIAL PRIMARY KEY,
    train_id INT NOT NULL REFERENCES train(train_id),
    route_id INT NOT NULL REFERENCES route(route_id),
    date DATE NOT NULL,
    starting_time TIME,
    station_id INT NOT NULL REFERENCES station(station_id),
    CONSTRAINT unique_train_schedule UNIQUE (train_id, date)
);

CREATE TABLE train_tracking (
    tracking_id SERIAL PRIMARY KEY,
    schedule_id INT NOT NULL REFERENCES schedule(schedule_id) ON DELETE CASCADE,
    station_id INT NOT NULL REFERENCES station(station_id),
    expected_time TIMESTAMP,
    actual_time TIMESTAMP,
    delay_minutes INT DEFAULT 0,
    coordinates VARCHAR(100),
    status VARCHAR(50),
    CONSTRAINT uq_tracking_schedule_station UNIQUE (schedule_id, station_id),
    CONSTRAINT chk_tracking_status CHECK (
        status IN ('on_time', 'delayed', 'arrived', 'departed', 'cancelled')
    )
);

CREATE TABLE ticket (
    ticket_id SERIAL PRIMARY KEY,
    schedule_id INT NOT NULL REFERENCES schedule(schedule_id),
    account_id INT NOT NULL REFERENCES account(account_id),
    no_of_seats INT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    from_station_id INT NOT NULL REFERENCES station(station_id),
    to_station_id INT NOT NULL REFERENCES station(station_id),
    CONSTRAINT uq_ticket_id_schedule UNIQUE (ticket_id, schedule_id),
    CONSTRAINT chk_ticket_status CHECK (
        status IN ('pending', 'booked', 'cancelled', 'completed')
    )
);

CREATE TABLE ticket_seat (
    ticket_id INT NOT NULL REFERENCES ticket(ticket_id) ON DELETE CASCADE,
    seat_id INT NOT NULL REFERENCES seat(seat_id),
    schedule_id INT NOT NULL REFERENCES schedule(schedule_id),
    from_seq INT NOT NULL,
    to_seq INT NOT NULL,
    PRIMARY KEY (ticket_id, seat_id),
    FOREIGN KEY (ticket_id, schedule_id) REFERENCES ticket(ticket_id, schedule_id),
    CONSTRAINT no_overlapping_confirmed_seats
        EXCLUDE USING gist (
            seat_id WITH =,
            schedule_id WITH =,
            int4range(from_seq, to_seq) WITH &&
        )
);

CREATE TABLE payment (
    payment_id SERIAL PRIMARY KEY,
    ticket_id INT NOT NULL REFERENCES ticket(ticket_id),
    amount DECIMAL(10, 2) NOT NULL,
    method VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    paid_at TIMESTAMP,
    CONSTRAINT uq_payment_ticket UNIQUE (ticket_id),
    CONSTRAINT chk_payment_status CHECK (
        status IN ('pending', 'paid', 'refunded', 'failed')
    )
);

CREATE TABLE seat_lock (
    lock_id SERIAL PRIMARY KEY,
    seat_id INT NOT NULL REFERENCES seat(seat_id) ON DELETE CASCADE,
    account_id INT NOT NULL REFERENCES account(account_id) ON DELETE CASCADE,
    requested_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    schedule_id INT NOT NULL REFERENCES schedule(schedule_id) ON DELETE CASCADE,
    from_seq INT NOT NULL,
    to_seq INT NOT NULL,
    CONSTRAINT chk_seat_lock_status CHECK (
        status IN ('active', 'confirmed', 'expired')
    ),
    CONSTRAINT no_overlapping_active_locks
        EXCLUDE USING gist (
            seat_id WITH =,
            schedule_id WITH =,
            int4range(from_seq, to_seq) WITH &&
        ) WHERE (status = 'active')
);

CREATE INDEX idx_coach_train ON coach(train_id);
CREATE INDEX idx_seat_coach ON seat(coach_id);
CREATE INDEX idx_ticket_schedule ON ticket(schedule_id);
