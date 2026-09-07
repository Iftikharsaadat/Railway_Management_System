const pool = require('../db');

const addTrain = async (trainName, routeId) => {
    const result = await pool.query(
      `INSERT INTO train (train_name, route_id)
       VALUES ($1, $2)
       RETURNING train_id, train_name, route_id`,
      [trainName, routeId]
    );

    return result.rows[0];
};
const addStation = async(station_name,city) => {
    const result = await pool.query(
       `INSERT INTO station (station_name, city)
        VALUES ($1, $2)
        RETURNING *;`,
        [station_name, city]
    );
    return result.rows[0];
}

const addRoute = async(start_station_id, end_station_id, stations = []) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const routeResult = await client.query(
           `INSERT INTO route (start_station_id, end_station_id)
            VALUES ($1, $2)
            RETURNING *;`,
            [start_station_id, end_station_id]
        );

        const route = routeResult.rows[0];
        const routeStations = [];

        for (const station of stations) {
            const stationResult = await client.query(
               `INSERT INTO route_station
                (route_id, station_id, sequence_no, arrival_time, departure_time, distance_km)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *;`,
                [
                    route.route_id,
                    station.station_id,
                    station.sequence_no,
                    station.arrival_time ?? null,
                    station.departure_time ?? null,
                    station.distance_km
                ]
            );
            routeStations.push(stationResult.rows[0]);
        }

        await client.query('COMMIT');
        return { route, routeStations };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

const addStationToRoute = async(route_id, station_id, sequence_no, arrival_time, departure_time, distance_km) => {
    const result = await pool.query(
       `INSERT INTO route_station
        (route_id, station_id, sequence_no, arrival_time, departure_time, distance_km)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;`,
        [route_id, station_id, sequence_no, arrival_time, departure_time, distance_km]
    );
    return result.rows[0];
}

const addCoach = async(train_id, coach_name, seats, type) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const coachResult = await client.query(
           `INSERT INTO coach (train_id, coach_name, seats, type)
            VALUES ($1, $2, $3, $4)
            RETURNING *;`,
            [train_id, coach_name, seats, type]
        );

        const coach = coachResult.rows[0];
        const seatResult = await client.query(
           `INSERT INTO seat (coach_id, seat_number, direction, reservation_status)
            SELECT
                $1,
                $2 || '-' || seat_number,
                CASE
                    WHEN $3 % 2 = 0 AND seat_number <= $4 / 2.0 THEN 'Backward'
                    WHEN $3 % 2 = 0 THEN 'Forward'
                    WHEN seat_number <= $4 / 2.0 THEN 'Forward'
                    ELSE 'Backward'
                END,
                'available'
            FROM generate_series(1, $4) AS seat_number
            RETURNING *;`,
            [coach.coach_id, coach_name, train_id, seats]
        );

        await client.query('COMMIT');
        return { coach, seats: seatResult.rows };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

const addSeat = async(coach_id, seat_number, direction, reservation_status) => {
    const result = await pool.query(
       `INSERT INTO seat
        (coach_id, seat_number, direction, reservation_status)
        VALUES ($1, $2, $3, COALESCE($4, 'available'))
        RETURNING *;`,
        [coach_id, seat_number, direction, reservation_status]
    );
    return result.rows[0];
}
const addTrackingTime = async(schedule_id, station_id, expected_time, status) => {
    const result = await pool.query(
       `INSERT INTO train_tracking
        (schedule_id, station_id, expected_time, status)
        VALUES ($1, $2, $3, $4)
        RETURNING *;`,
        [schedule_id, station_id, expected_time, status]
    );
    return result.rows[0];
}
const updateTrainTracking = async(coordinates, actual_time, delay_minutes, status, tracking_id) => {
    const result = await pool.query(
       `UPDATE train_tracking
        SET coordinates = $1,
            actual_time = $2,
            delay_minutes = $3,
            status = $4
        WHERE tracking_id = $5
        RETURNING *;`,
        [coordinates, actual_time, delay_minutes, status, tracking_id]
    );
    return result.rows[0];
}



const findTrainsByRoute = async (from, to, date) => {
    const qTrains = `
      SELECT t.train_name, 
      t.route_id,
      rs1.departure_time AS departure_from_source, 
      rs2.arrival_time AS arrival_at_destination

      FROM train t
      JOIN route_station rs1 ON t.route_id = rs1.route_id
      JOIN route_station rs2 ON t.route_id = rs2.route_id
      JOIN station s1 ON rs1.station_id = s1.station_id
      JOIN station s2 ON rs2.station_id = s2.station_id
      JOIN schedule sch ON sch.train_id = t.train_id
      WHERE s1.station_name = $1 
        AND s2.station_name = $2 
        AND sch.date = $3
        AND rs1.sequence_no < rs2.sequence_no;
  `;

    const qRoute = `
      SELECT rs.route_id, rs.sequence_no, s.station_name
      FROM route_station rs
      JOIN station s ON rs.station_id = s.station_id
      WHERE rs.route_id IN (
          SELECT t.route_id
          FROM train t
          JOIN route_station rs1 ON t.route_id = rs1.route_id
          JOIN route_station rs2 ON t.route_id = rs2.route_id
          JOIN station s1 ON rs1.station_id = s1.station_id
          JOIN station s2 ON rs2.station_id = s2.station_id
          WHERE s1.station_name = $1 
            AND s2.station_name = $2 
            AND rs1.sequence_no < rs2.sequence_no
      )
      ORDER BY rs.route_id, rs.sequence_no;
  `;
    const Trains = await pool.query(qTrains,[from, to, date]);
    const Route = await pool.query(qRoute,[from, to]);
    console.table(Trains.rows);
    console.table(Route.rows);
    return{
        availableTrains: Trains.rows,
        availableRoute: Route.rows
    };
};
const showTrainDetails = async (train_id, from, to, date) => {
    const qRoute = `
    SELECT rs.sequence_no, s.station_name
    FROM train t
    JOIN route_station rs ON rs.route_id = t.route_id
    JOIN station s on rs.station_id = s.station_id
    WHERE train_id = $1
    `;
    const qTypes = `
    WITH journey_details AS (
    SELECT 
        sc.schedule_id,
        t.route_id,
        (SELECT sequence_no FROM route_station rs 
         JOIN station st ON rs.station_id = st.station_id 
         WHERE st.station_name = $2 AND rs.route_id = t.route_id) as start_seq,
        (SELECT sequence_no FROM route_station rs 
         JOIN station st ON rs.station_id = st.station_id 
         WHERE st.station_name = $4 AND rs.route_id = t.route_id) as end_seq,
        (SELECT distance_km FROM route_station rs 
         JOIN station st ON rs.station_id = st.station_id 
         WHERE st.station_name = $2 AND rs.route_id = t.route_id) as start_distance,
        (SELECT distance_km FROM route_station rs 
         JOIN station st ON rs.station_id = st.station_id 
         WHERE st.station_name = $4 AND rs.route_id = t.route_id) as end_distance
    FROM train t
    JOIN schedule sc ON sc.train_id = t.train_id
    WHERE t.train_id = $3 AND sc."date" = $1
    ),
    seat_statuses AS (
        SELECT 
            c.type as coach_type,
            s.seat_id,
            fr.base_fare + (fr.rate_per_km * (jd.end_distance - jd.start_distance)) as calculated_price,
            CASE 
                -- 1. Check if booked
                WHEN EXISTS (
                    SELECT 1 FROM ticket_seat ts
                    WHERE ts.seat_id = s.seat_id
                      AND ts.schedule_id = jd.schedule_id
                      AND int4range(ts.from_seq, ts.to_seq) && int4range(jd.start_seq, jd.end_seq)
                ) THEN 'booked'

                -- 2. Check if locked (pending)
                WHEN EXISTS (
                    SELECT 1 FROM seat_lock sl
                    WHERE sl.seat_id = s.seat_id
                      AND sl.schedule_id = jd.schedule_id
                      AND sl.status = 'active'
                      AND sl.expires_at > NOW()
                      AND int4range(sl.from_seq, sl.to_seq) && int4range(jd.start_seq, jd.end_seq)
                ) THEN 'pending'

                ELSE 'available'
            END AS status
        FROM seat s
        JOIN coach c ON s.coach_id = c.coach_id
        JOIN fare_rate fr ON fr.seat_type = c.type
        LEFT JOIN journey_details jd ON true
        WHERE c.train_id = $3
    )
    SELECT 
        coach_type,
        ROUND(MAX(calculated_price),2) AS price,
        COUNT(*) FILTER (WHERE status = 'available') AS available_count,
        COUNT(*) FILTER (WHERE status = 'booked') AS booked_count,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_count
    FROM seat_statuses
    GROUP BY coach_type;
    `;
    const qCoaches = `
    SELECT t.train_name, c.coach_name
    FROM coach c
    JOIN train t ON c.train_id = t.train_id
    WHERE t.train_id = $1
    `;
    const qSeats = `
    WITH journey_details AS (
    SELECT 
        sc.schedule_id,
        t.route_id,
        (SELECT sequence_no FROM route_station rs 
         JOIN station st ON rs.station_id = st.station_id 
         WHERE st.station_name = $2 AND rs.route_id = t.route_id) as start_seq,
        (SELECT sequence_no FROM route_station rs 
         JOIN station st ON rs.station_id = st.station_id 
         WHERE st.station_name = $4 AND rs.route_id = t.route_id) as end_seq,
        (SELECT distance_km FROM route_station rs 
         JOIN station st ON rs.station_id = st.station_id 
         WHERE st.station_name = $2 AND rs.route_id = t.route_id) as start_distance,
        (SELECT distance_km FROM route_station rs 
         JOIN station st ON rs.station_id = st.station_id 
         WHERE st.station_name = $4 AND rs.route_id = t.route_id) as end_distance
    FROM train t
    JOIN schedule sc ON sc.train_id = t.train_id
    WHERE t.train_id = $3 AND sc."date" = $1
    )
    SELECT 
        s.seat_id, 
        s.seat_number,
        s.direction, 
        c.coach_name,
        c.type, 
        fr.base_fare + (fr.rate_per_km * (jd.end_distance - jd.start_distance)) as calculated_price,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM ticket_seat ts
                CROSS JOIN journey_details jd
                WHERE ts.seat_id = s.seat_id
                  AND ts.schedule_id = jd.schedule_id
                  AND int4range(ts.from_seq, ts.to_seq) && int4range(jd.start_seq, jd.end_seq)
            ) THEN 'booked'

            WHEN EXISTS (
                SELECT 1 FROM seat_lock sl
                CROSS JOIN journey_details jd
                WHERE sl.seat_id = s.seat_id
                  AND sl.schedule_id = jd.schedule_id
                  AND sl.status = 'active'
                  AND sl.expires_at > NOW()
                  AND int4range(sl.from_seq, sl.to_seq) && int4range(jd.start_seq, jd.end_seq)
            ) THEN 'pending'

            ELSE 'available'
        END AS segment_status
    FROM seat s
    JOIN coach c ON s.coach_id = c.coach_id
    JOIN fare_rate fr ON fr.seat_type = c.type
    LEFT JOIN journey_details jd ON TRUE
    WHERE c.train_id = $3;
  `;
    // const Route  = await pool.query(qRoute, [train_id]);

    const [Route, Coaches, Seats, Types] = await Promise.all([
      pool.query(qRoute, [train_id]),
      pool.query(qCoaches, [train_id]),
      pool.query(qSeats, [date, from,train_id,to]),
      pool.query(qTypes, [date, from,train_id,to])
    ]);
    console.table(Route.rows);
    console.table(Types.rows);
    console.table(Coaches.rows);
    console.table(Seats.rows);
    return{
      route: Route.rows,
      types: Types.rows,
      coaches: Coaches.rows,
      seats: Seats.rows
    };
}
module.exports = {
    addTrain,
    addStation,
    addRoute,
    addStationToRoute,
    addCoach,
    addSeat,
    addTrackingTime,
    updateTrainTracking,
    findTrainsByRoute,
    showTrainDetails
};