const pool = require('../db');

const addTrain = async (trainName, routeId, offDay) => {
    const result = await pool.query(
    `INSERT INTO train (train_name, route_id, off_day)
     VALUES ($1, $2, $3)
     RETURNING train_id, train_name, route_id, off_day`,
    [trainName, routeId, offDay || null]
    );

    return result.rows[0];
};

  const addTrainWithRoute = async (trainName, offDay, stations) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const routeResult = await client.query(
        `INSERT INTO route (start_station_id, end_station_id) VALUES ($1, $2) RETURNING *`,
        [stations[0].station_id, stations[stations.length - 1].station_id]
      );
      const route = routeResult.rows[0];
      for (const [index, station] of stations.entries()) {
        await client.query(
          `INSERT INTO route_station (route_id, station_id, sequence_no, arrival_time, departure_time, distance_km)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [route.route_id, station.station_id, index + 1, station.arrival_time ?? null, station.departure_time ?? null, station.distance_km]
        );
      }
      const trainResult = await client.query(
        `INSERT INTO train (train_name, route_id, off_day) VALUES ($1, $2, $3) RETURNING *`,
        [trainName, route.route_id, offDay || null]
      );
      await client.query('COMMIT');
      return { route, train: trainResult.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
       `INSERT INTO route_station
      (route_id, station_id, sequence_no, arrival_time, departure_time, distance_km)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;`,
      [route_id, station_id, sequence_no, arrival_time, departure_time, distance_km]
    );
    await client.query(
      `UPDATE route SET start_station_id = (SELECT station_id FROM route_station WHERE route_id = $1 ORDER BY sequence_no LIMIT 1),
       end_station_id = (SELECT station_id FROM route_station WHERE route_id = $1 ORDER BY sequence_no DESC LIMIT 1)
       WHERE route_id = $1`,
      [route_id]
    );
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
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

const updateTrain = async(train_name, off_day, train_id) =>{
    const result = await pool.query(
        `UPDATE train
        SET
            train_name = COALESCE($1, train_name),
            off_day = COALESCE ($2, off_day)
        WHERE train_id = $3
        RETURNING *`, [train_name, off_day, train_id]
    )
    return result.rows[0];
}

const updateStation = async(station_name, city, station_id) =>{
    const result = await pool.query(
        `UPDATE station
        SET
            station_name = COALESCE($1, station_name),
            city = COALESCE($2, city)
        WHERE station_id = $3
        RETURNING *`, [station_name, city, station_id]
    );
    return result.rows[0];
}

const updateRoute = async(route_id, stations) =>{
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const routeResult = await client.query(
            `SELECT route_id
            FROM route
            WHERE route_id = $1
            FOR UPDATE`, [route_id]
        );

        if (routeResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }

        await client.query(
            `DELETE FROM route_station
            WHERE route_id = $1`, [route_id]
        );

        const orderedStations = [...stations].sort((left, right) => Number(left.sequence_no) - Number(right.sequence_no));
        const routeStations = [];
        for (const station of orderedStations) {
            const stationResult = await client.query(
                `INSERT INTO route_station
                (route_id, station_id, sequence_no, arrival_time, departure_time, distance_km)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *`,
                [
                    route_id,
                    station.station_id,
                    Number(station.sequence_no),
                    station.arrival_time ?? null,
                    station.departure_time ?? null,
                    station.distance_km
                ]
            );
            routeStations.push(stationResult.rows[0]);
        }

        const updatedRoute = await client.query(
            `UPDATE route
            SET start_station_id = $1,
                end_station_id = $2
            WHERE route_id = $3
            RETURNING *`,
            [orderedStations[0].station_id, orderedStations[orderedStations.length - 1].station_id, route_id]
        );

        await client.query('COMMIT');
        return { route: updatedRoute.rows[0], routeStations };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

const updateCoach = async(coach_name, seats, type, coach_id) =>{
    const result = await pool.query(
        `UPDATE coach
        SET
            coach_name = COALESCE($1, coach_name),
            seats = COALESCE($2, seats),
            type = COALESCE($3, type)
        WHERE coach_id = $4
        RETURNING *`, [coach_name, seats, type, coach_id]
    );
    return result.rows[0];
}

const updateSchedule = async(train_id, route_id, date, starting_time, station_id, schedule_id) =>{
  const currentSchedule = await pool.query(
    `SELECT train_id, route_id, date::text AS date FROM schedule WHERE schedule_id = $1`,
    [schedule_id]
  );
  if (currentSchedule.rowCount === 0) return null;

  const nextTrainId = train_id ?? currentSchedule.rows[0].train_id;
  const nextRouteId = route_id ?? currentSchedule.rows[0].route_id;
  const nextDate = date ?? currentSchedule.rows[0].date;
  const conflictingSchedule = await pool.query(
    `SELECT schedule_id FROM schedule
     WHERE train_id = $1 AND date = $2 AND schedule_id <> $3
     LIMIT 1`,
    [nextTrainId, nextDate, schedule_id]
  );
  if (conflictingSchedule.rowCount > 0) {
    throw createAdminDeleteError(
      "This train already has another schedule on the selected date. Choose a different date.",
      409
    );
  }

  if (nextRouteId != null && station_id != null) {
    const stationOnRoute = await pool.query(
      `SELECT 1 FROM route_station WHERE route_id = $1 AND station_id = $2`,
      [nextRouteId, station_id]
    );
    if (stationOnRoute.rowCount === 0) {
      throw createAdminDeleteError("The selected starting station does not belong to this route.", 409);
    }
  }
    const result = await pool.query(
        `UPDATE schedule
        SET
            train_id = COALESCE($1, train_id),
            route_id = COALESCE($2, route_id),
            date = COALESCE($3, date),
            starting_time = COALESCE($4, starting_time),
            station_id = COALESCE($5, station_id)
        WHERE schedule_id = $6
        RETURNING *`, [train_id, route_id, date, starting_time, station_id, schedule_id]
    );
    return result.rows[0];
}



const findTrainsByRoute = async (from, to, date) => {
    const qTrains = `
    SELECT t.train_id,
    t.train_name,
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


const createAdminDeleteError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};


// =====================================================
// DELETE TRAIN
// =====================================================

const deleteTrain = async (trainId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const trainResult = await client.query(
      `
      SELECT train_id, train_name
      FROM train
      WHERE train_id = $1
      FOR UPDATE
      `,
      [trainId]
    );

    if (trainResult.rowCount === 0) {
      throw createAdminDeleteError("Train not found", 404);
    }

    // Find schedules belonging to this train
    const schedules = await client.query(
      `
      SELECT schedule_id
      FROM schedule
      WHERE train_id = $1
      `,
      [trainId]
    );

    const scheduleIds = schedules.rows.map(
      (row) => row.schedule_id
    );

    if (scheduleIds.length > 0) {
      const ticketReference = await client.query(
        `SELECT 1 FROM ticket WHERE schedule_id = ANY($1::int[]) LIMIT 1`,
        [scheduleIds]
      );
      if (ticketReference.rowCount > 0) {
        throw createAdminDeleteError(
          "This train cannot be deleted because one or more schedules have booking history. Preserve the tickets and remove the train through a separate archival policy.",
          409
        );
      }

      await client.query(
        `
        DELETE FROM schedule
        WHERE train_id = $1
        `,
        [trainId]
      );
    }

    // Delete seats belonging to coaches of this train
    await client.query(
      `
      DELETE FROM seat
      WHERE coach_id IN (
        SELECT coach_id
        FROM coach
        WHERE train_id = $1
      )
      `,
      [trainId]
    );

    // Delete coaches
    await client.query(
      `
      DELETE FROM coach
      WHERE train_id = $1
      `,
      [trainId]
    );

    // Finally delete train
    await client.query(
      `
      DELETE FROM train
      WHERE train_id = $1
      `,
      [trainId]
    );

    await client.query("COMMIT");

    return trainResult.rows[0];

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }
};


// =====================================================
// DELETE COACH
// =====================================================

const deleteCoach = async (coachId) => {
  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const coachResult = await client.query(
      `
      SELECT coach_id, coach_name
      FROM coach
      WHERE coach_id = $1
      FOR UPDATE
      `,
      [coachId]
    );

    if (coachResult.rowCount === 0) {
      throw createAdminDeleteError(
        "Coach not found",
        404
      );
    }

    // Check whether seats from this coach
    // are already present in ticket_seat
    const bookedSeats = await client.query(
      `
      SELECT 1
      FROM ticket_seat ts
      JOIN seat s
        ON s.seat_id = ts.seat_id
      WHERE s.coach_id = $1
      LIMIT 1
      `,
      [coachId]
    );

    if (bookedSeats.rowCount > 0) {

      throw createAdminDeleteError(
        "Cannot delete this coach because one or more seats have ticket records.",
        409
      );

    }

    // seat_lock has ON DELETE CASCADE
    // from seat
    await client.query(
      `
      DELETE FROM seat
      WHERE coach_id = $1
      `,
      [coachId]
    );

    // Delete coach
    await client.query(
      `
      DELETE FROM coach
      WHERE coach_id = $1
      `,
      [coachId]
    );

    await client.query("COMMIT");

    return coachResult.rows[0];

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }
};


// =====================================================
// DELETE SCHEDULE
// =====================================================

const deleteSchedule = async (scheduleId) => {
  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const scheduleResult = await client.query(
      `
      SELECT
        schedule_id,
        train_id,
        route_id,
        date
      FROM schedule
      WHERE schedule_id = $1
      FOR UPDATE
      `,
      [scheduleId]
    );

    if (scheduleResult.rowCount === 0) {

      throw createAdminDeleteError(
        "Schedule not found",
        404
      );

    }

    // Delete payments first
    await client.query(
      `
      DELETE FROM payment
      WHERE ticket_id IN (
        SELECT ticket_id
        FROM ticket
        WHERE schedule_id = $1
      )
      `,
      [scheduleId]
    );

    // Delete tickets
    await client.query(
      `
      DELETE FROM ticket
      WHERE schedule_id = $1
      `,
      [scheduleId]
    );

    // train_tracking and seat_lock
    // use ON DELETE CASCADE
    await client.query(
      `
      DELETE FROM schedule
      WHERE schedule_id = $1
      `,
      [scheduleId]
    );

    await client.query("COMMIT");

    return scheduleResult.rows[0];

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }
};


// =====================================================
// DELETE ROUTE
// =====================================================

const deleteRoute = async (routeId) => {
  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const routeResult = await client.query(
      `
      SELECT
        route_id,
        start_station_id,
        end_station_id
      FROM route
      WHERE route_id = $1
      FOR UPDATE
      `,
      [routeId]
    );

    if (routeResult.rowCount === 0) {

      throw createAdminDeleteError(
        "Route not found",
        404
      );

    }

    // Check whether a train is using this route
    const trainResult = await client.query(
      `
      SELECT
        train_id,
        train_name
      FROM train
      WHERE route_id = $1
      LIMIT 1
      `,
      [routeId]
    );

    if (trainResult.rowCount > 0) {

      throw createAdminDeleteError(
        `Cannot delete route ${routeId} because train "${trainResult.rows[0].train_name}" uses it. Delete the train first.`,
        409
      );

    }

    // route_station rows are deleted
    // automatically because schema2 has
    // ON DELETE CASCADE
    await client.query(
      `
      DELETE FROM route
      WHERE route_id = $1
      `,
      [routeId]
    );

    await client.query("COMMIT");

    return routeResult.rows[0];

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }
};


// =====================================================
// DELETE STATION
// =====================================================

const deleteStation = async (stationId) => {
  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const stationResult = await client.query(
      `
      SELECT
        station_id,
        station_name
      FROM station
      WHERE station_id = $1
      FOR UPDATE
      `,
      [stationId]
    );

    if (stationResult.rowCount === 0) {

      throw createAdminDeleteError(
        "Station not found",
        404
      );

    }

    const routeRows = await client.query(
      `SELECT route_id, station_id, sequence_no, arrival_time, departure_time, distance_km
       FROM route_station
       WHERE station_id = $1
       ORDER BY route_id, sequence_no
       FOR UPDATE`,
      [stationId]
    );

    const routes = [...new Set(routeRows.rows.map((row) => row.route_id))];
    for (const routeId of routes) {
      const stationRows = await client.query(
        `SELECT station_id, arrival_time, departure_time, distance_km
         FROM route_station
         WHERE route_id = $1 AND station_id <> $2
         ORDER BY sequence_no
         FOR UPDATE`,
        [routeId, stationId]
      );

      if (stationRows.rowCount < 2) {
        throw createAdminDeleteError(
          `Cannot remove ${stationResult.rows[0].station_name} because Route ${routeId} would have fewer than two stations.`,
          409
        );
      }

      await client.query(`DELETE FROM route_station WHERE route_id = $1 AND station_id = $2`, [routeId, stationId]);
      for (const [index, row] of stationRows.rows.entries()) {
        await client.query(
          `UPDATE route_station SET sequence_no = $1 WHERE route_id = $2 AND station_id = $3`,
          [index + 1, routeId, row.station_id]
        );
      }
      await client.query(
        `UPDATE route SET start_station_id = $1, end_station_id = $2 WHERE route_id = $3`,
        [stationRows.rows[0].station_id, stationRows.rows[stationRows.rowCount - 1].station_id, routeId]
      );
    }

    const scheduleReference = await client.query(`SELECT 1 FROM schedule WHERE station_id = $1 LIMIT 1`, [stationId]);
    const trackingReference = await client.query(`SELECT 1 FROM train_tracking WHERE station_id = $1 LIMIT 1`, [stationId]);
    const ticketReference = await client.query(
      `SELECT 1 FROM ticket WHERE from_station_id = $1 OR to_station_id = $1 LIMIT 1`,
      [stationId]
    );
    if (scheduleReference.rowCount > 0 || trackingReference.rowCount > 0 || ticketReference.rowCount > 0) {
      throw createAdminDeleteError(
        "This station was removed from active routes but cannot be deleted because schedules, tracking, or ticket history still reference it.",
        409
      );
    }

    await client.query(
      `
      DELETE FROM station
      WHERE station_id = $1
      `,
      [stationId]
    );

    await client.query("COMMIT");

    return stationResult.rows[0];

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }
};

const getAdminOverview = async () => {
  const [trains, stations, routes, schedules, routeStations] = await Promise.all([
    pool.query(`
      SELECT t.train_id, t.train_name, t.off_day, t.route_id,
             COUNT(DISTINCT c.coach_id)::int AS coach_count,
              from_s.station_name AS from_station, to_s.station_name AS to_station,
             COUNT(DISTINCT sch.schedule_id)::int AS schedule_count
      FROM train t
      JOIN route r ON r.route_id = t.route_id
            JOIN LATERAL (SELECT s.station_name FROM route_station rs JOIN station s ON s.station_id = rs.station_id
                WHERE rs.route_id = r.route_id ORDER BY rs.sequence_no LIMIT 1) from_s ON true
            JOIN LATERAL (SELECT s.station_name FROM route_station rs JOIN station s ON s.station_id = rs.station_id
                WHERE rs.route_id = r.route_id ORDER BY rs.sequence_no DESC LIMIT 1) to_s ON true
      LEFT JOIN coach c ON c.train_id = t.train_id
      LEFT JOIN schedule sch ON sch.train_id = t.train_id
      GROUP BY t.train_id, r.route_id, from_s.station_name, to_s.station_name
      ORDER BY t.train_name`),
    pool.query(`SELECT station_id, station_name, city FROM station ORDER BY station_name`),
    pool.query(`SELECT route_id, start_station_id, end_station_id FROM route ORDER BY route_id`),
    pool.query(`SELECT s.schedule_id, s.train_id, s.route_id, s.date::text AS date, s.starting_time, s.station_id, t.train_name, st.station_name
                FROM schedule s JOIN train t ON t.train_id = s.train_id JOIN station st ON st.station_id = s.station_id
                ORDER BY s.date DESC, t.train_name`),
    pool.query(`SELECT rs.route_id, rs.station_id, rs.sequence_no, st.station_name, st.city
                FROM route_station rs JOIN station st ON st.station_id = rs.station_id
                ORDER BY rs.route_id, rs.sequence_no`)
  ]);
  return { trains: trains.rows, stations: stations.rows, routes: routes.rows, schedules: schedules.rows, routeStations: routeStations.rows };
};

const getRouteDetails = async (routeId) => {
  const route = await pool.query(`SELECT r.route_id, r.start_station_id, r.end_station_id,
    from_s.station_id AS derived_start_station_id, to_s.station_id AS derived_end_station_id,
    from_s.station_name AS from_station, to_s.station_name AS to_station
    FROM route r
    JOIN LATERAL (SELECT s.station_id, s.station_name FROM route_station rs JOIN station s ON s.station_id = rs.station_id
      WHERE rs.route_id = r.route_id ORDER BY rs.sequence_no LIMIT 1) from_s ON true
    JOIN LATERAL (SELECT s.station_id, s.station_name FROM route_station rs JOIN station s ON s.station_id = rs.station_id
      WHERE rs.route_id = r.route_id ORDER BY rs.sequence_no DESC LIMIT 1) to_s ON true
    WHERE r.route_id = $1`, [routeId]);
  if (!route.rowCount) return null;
  const stations = await pool.query(`SELECT rs.station_id, rs.sequence_no, rs.arrival_time, rs.departure_time,
    rs.distance_km, s.station_name, s.city FROM route_station rs JOIN station s ON s.station_id = rs.station_id
    WHERE rs.route_id = $1 ORDER BY rs.sequence_no`, [routeId]);
  return { route: route.rows[0], stations: stations.rows };
};

const getTrainCoaches = async (trainId) => {
  const train = await pool.query(`SELECT train_id, train_name FROM train WHERE train_id = $1`, [trainId]);
  if (!train.rowCount) return null;
  const coaches = await pool.query(`SELECT c.coach_id, c.coach_name, c.seats, c.type,
    COUNT(s.seat_id)::int AS seat_count FROM coach c LEFT JOIN seat s ON s.coach_id = c.coach_id
    WHERE c.train_id = $1 GROUP BY c.coach_id ORDER BY c.coach_name`, [trainId]);
  return { train: train.rows[0], coaches: coaches.rows };
};

const getCoachSeats = async (coachId) => {
  const coach = await pool.query(`SELECT coach_id, train_id, coach_name, type FROM coach WHERE coach_id = $1`, [coachId]);
  if (!coach.rowCount) return null;
  const seats = await pool.query(`SELECT seat_id, seat_number, direction, reservation_status FROM seat WHERE coach_id = $1 ORDER BY seat_number`, [coachId]);
  return { coach: coach.rows[0], seats: seats.rows };
};


module.exports = {
    addTrain,
  addTrainWithRoute,
    addStation,
    addRoute,
    addStationToRoute,
    addCoach,
    addSeat,
    addTrackingTime,
    updateTrainTracking,
    updateTrain,
    updateStation,
    updateRoute,
    updateCoach,
    updateSchedule,
    findTrainsByRoute,
    showTrainDetails,
    deleteTrain,
    deleteCoach,
    deleteRoute,
    deleteSchedule,
    deleteStation,
    getAdminOverview,
    getRouteDetails,
    getTrainCoaches,
    getCoachSeats
};