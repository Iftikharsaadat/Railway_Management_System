const pool = require('../db');

const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Attach the requested station pair to the schedule's route sequence and fare distance.
const resolveJourney = async (db, { schedule_id, train_id, date, from_station_id, to_station_id }) => {
  const result = await db.query(`
    SELECT sch.schedule_id, sch.train_id, sch.route_id, sch.date, sch.starting_time,
      rs1.station_id AS from_station_id, rs2.station_id AS to_station_id,
      t.train_name, rs1.sequence_no AS from_seq, rs2.sequence_no AS to_seq,
      rs1.distance_km AS from_distance, rs2.distance_km AS to_distance,
      s1.station_name AS from_station, s2.station_name AS to_station
    FROM schedule sch
    JOIN train t ON t.train_id = sch.train_id
    JOIN route_station rs1
      ON rs1.route_id = sch.route_id
      AND rs1.station_id = $2
    JOIN route_station rs2
      ON rs2.route_id = sch.route_id
      AND rs2.station_id = $3
    JOIN station s1 ON s1.station_id = rs1.station_id
    JOIN station s2 ON s2.station_id = rs2.station_id
    WHERE ((
        $1::int IS NOT NULL
        AND sch.schedule_id = $1
      ) OR (
        $1::int IS NULL
        AND sch.train_id = $4
        AND sch.date = $5
      ))
      AND rs1.sequence_no < rs2.sequence_no
  `, [schedule_id || null, from_station_id, to_station_id, train_id || null, date || null]);
  if (!result.rowCount) throw fail('Schedule or journey stations were not found for this route.', 404);
  return result.rows[0];
};

// Expired rows no longer block a seat; keep their status in sync for inspection.
const expireLocks = async (db, scheduleId) => {
  const update = (client) => client.query(
    `UPDATE seat_lock
     SET status = 'expired'
     WHERE schedule_id = $1
       AND status = 'active'
       AND expires_at <= clock_timestamp()`,
    [scheduleId]
  );
  return db === pool ? withTransaction(update) : update(db);
};

const getActiveSeatLock = async (db, seatId, journey) => {
  const result = await db.query(`
    SELECT *
    FROM seat_lock
    WHERE seat_id = $1
      AND schedule_id = $2
      AND status = 'active'
      AND expires_at > clock_timestamp()
      AND int4range(from_seq, to_seq) && int4range($3::int, $4::int)
    FOR UPDATE
  `, [seatId, journey.schedule_id, journey.from_seq, journey.to_seq]);
  return result.rows[0] || null;
};

const getSeatPrice = async (db, seatId, journey) => {
  const result = await db.query(`
    SELECT
      s.seat_id,
      s.seat_number,
      s.direction,
      c.coach_name,
      c.type AS seat_type,
      calculate_fare(c.type, $2::numeric - $1::numeric) AS price
    FROM seat s
    JOIN coach c ON c.coach_id = s.coach_id
    JOIN fare_rate fr ON fr.seat_type = c.type
    WHERE s.seat_id = $3
      AND c.train_id = $4
  `, [journey.from_distance, journey.to_distance, seatId, journey.train_id]);
  if (!result.rowCount) throw fail('Seat not found for this train or fare is not configured.', 404);
  return result.rows[0];
};

const validateMaximumTickets = async (db, accountId, journey, seatIds = []) => {
  // Count other active locks plus already paid tickets for this same station pair.
  const count = await db.query(`
    SELECT
      (
        SELECT count(DISTINCT sl.seat_id)
        FROM seat_lock sl
        WHERE sl.account_id = $1
          AND sl.schedule_id = $2
          AND sl.status = 'active'
          AND sl.expires_at > clock_timestamp()
          AND sl.from_seq = $3
          AND sl.to_seq = $4
          AND NOT (sl.seat_id = ANY($5::int[]))
      ) + (
        SELECT count(DISTINCT ts.seat_id)
        FROM ticket tk
        JOIN ticket_seat ts ON ts.ticket_id = tk.ticket_id
        JOIN payment p ON p.ticket_id = tk.ticket_id
        WHERE tk.account_id = $1
          AND tk.schedule_id = $2
          AND tk.from_station_id = $6
          AND tk.to_station_id = $7
          AND tk.status IN ('booked', 'completed')
          AND p.status = 'paid'
      ) AS used
  `, [accountId, journey.schedule_id, journey.from_seq, journey.to_seq, seatIds, journey.from_station_id, journey.to_station_id]);
  return Number(count.rows[0].used || 0);
};

const getAvailableSeats = async ({ schedule_id, train_id, date, from_station_id, to_station_id }) => {
  const journey = await resolveJourney(pool, { schedule_id, train_id, date, from_station_id, to_station_id });
  await expireLocks(pool, journey.schedule_id);
  // Status is segment-specific: confirmed tickets take precedence over live locks.
  const result = await pool.query(`
    SELECT
      d.*,
      CASE
        WHEN EXISTS (
          SELECT 1
          FROM ticket_seat ts
          WHERE ts.seat_id = d.seat_id
            AND ts.schedule_id = $1
            AND int4range(ts.from_seq, ts.to_seq) && int4range($2::int, $3::int)
        ) THEN 'booked'
        WHEN EXISTS (
          SELECT 1
          FROM seat_lock sl
          WHERE sl.seat_id = d.seat_id
            AND sl.schedule_id = $1
            AND sl.status = 'active'
            AND sl.expires_at > clock_timestamp()
            AND int4range(sl.from_seq, sl.to_seq) && int4range($2::int, $3::int)
        ) THEN 'pending'
        ELSE 'available'
      END AS status
    FROM (
      SELECT
        s.seat_id,
        s.seat_number,
        s.direction,
        c.coach_name,
        c.type AS seat_type,
        calculate_fare(c.type, $5::numeric - $4::numeric) AS price
      FROM seat s
      JOIN coach c ON c.coach_id = s.coach_id
      JOIN fare_rate fr ON fr.seat_type = c.type
      WHERE c.train_id = $6
    ) d
    ORDER BY d.coach_name, d.seat_number
  `, [journey.schedule_id, journey.from_seq, journey.to_seq, journey.from_distance, journey.to_distance, journey.train_id]);
  return { journey, seats: result.rows };
};

const addSeatLock = async (accountId, input) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const journey = await resolveJourney(client, input);
    // Serialize lock attempts on this schedule; the exclusion constraint protects overlapping segments too.
    await client.query(`
      SELECT schedule_id
      FROM schedule
      WHERE schedule_id = $1
      FOR UPDATE
    `, [journey.schedule_id]);
    await expireLocks(client, journey.schedule_id);
    const seat = await getSeatPrice(client, input.seat_id, journey);
    const booked = await client.query(`
      SELECT 1
      FROM ticket_seat ts
      JOIN ticket tk ON tk.ticket_id = ts.ticket_id
      WHERE ts.seat_id = $1
        AND ts.schedule_id = $2
        AND int4range(ts.from_seq, ts.to_seq) && int4range($3::int, $4::int)
        AND tk.status IN ('booked', 'completed')
      LIMIT 1
    `, [seat.seat_id, journey.schedule_id, journey.from_seq, journey.to_seq]);
    if (booked.rowCount) throw fail('This seat is already booked.');
    const active = await getActiveSeatLock(client, seat.seat_id, journey);
    if (active) {
      if (active.account_id === Number(accountId)) {
        await client.query(`
          DELETE FROM seat_lock
          WHERE lock_id = $1
        `, [active.lock_id]);
        await client.query('COMMIT');
        return { unlocked: true, seat_id: seat.seat_id, status: 'available' };
      }
      throw fail('This seat is temporarily locked by another user.', 409);
    }
    const used = await validateMaximumTickets(client, accountId, journey);
    if (used + 1 > 4) throw fail('You can select a maximum of 4 tickets for this journey.');
    // Use database time so the lock expires exactly five minutes after insertion.
    const lock = await client.query(`
      INSERT INTO seat_lock (seat_id, account_id, expires_at, schedule_id, from_seq, to_seq)
      VALUES ($1, $2, clock_timestamp() + INTERVAL '5 minutes', $3, $4, $5)
      RETURNING lock_id, requested_at, expires_at
    `, [seat.seat_id, accountId, journey.schedule_id, journey.from_seq, journey.to_seq]);
    await client.query('COMMIT');
    return { ...seat, status: 'pending', ...lock.rows[0], schedule_id: journey.schedule_id };
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23P01' || error.code === '23505') throw fail('This seat was just locked by another user.', 409);
    throw error;
  } finally { client.release(); }
};

const removeSeatLock = async (accountId, lockId) => {
  // The account predicate prevents a user from removing another user's lock.
  const result = await withTransaction((client) => client.query(`
    UPDATE seat_lock
    SET status = 'expired'
    WHERE lock_id = $1
      AND account_id = $2
      AND status = 'active'
      AND expires_at > clock_timestamp()
    RETURNING lock_id, seat_id
  `, [lockId, accountId]));
  if (!result.rowCount) throw fail('Active seat lock not found.', 404);
  return result.rows[0];
};

const getUserActiveLocks = async (accountId, journeyInput) => {
  const journey = await resolveJourney(pool, journeyInput);
  await expireLocks(pool, journey.schedule_id);
  const result = await pool.query(`
    SELECT
      sl.lock_id,
      sl.seat_id,
      sl.expires_at,
      s.seat_number,
      c.coach_name,
      c.type AS seat_type,
      calculate_fare(c.type, $1::numeric - $2::numeric) AS price
    FROM seat_lock sl
    JOIN seat s ON s.seat_id = sl.seat_id
    JOIN coach c ON c.coach_id = s.coach_id
    JOIN fare_rate fr ON fr.seat_type = c.type
    WHERE sl.account_id = $3
      AND sl.schedule_id = $4
      AND sl.status = 'active'
      AND sl.expires_at > clock_timestamp()
      AND sl.from_seq = $5
      AND sl.to_seq = $6
    ORDER BY sl.lock_id
  `, [journey.to_distance, journey.from_distance, accountId, journey.schedule_id, journey.from_seq, journey.to_seq]);
  return { journey, locks: result.rows };
};

const validateSelection = async (accountId, input) => {
  const selection = await getUserActiveLocks(accountId, input);
  const requested = [...new Set((input.seat_ids || []).map(Number))];
  if (!requested.length || requested.some(id => !Number.isInteger(id) || id <= 0)) throw fail('seat_ids must contain selected seat IDs.');
  const owned = new Set(selection.locks.map(lock => Number(lock.seat_id)));
  if (requested.some(id => !owned.has(id))) throw fail('One or more selected seats are no longer locked by you or the lock expired.', 409);
  // Recheck the four-ticket cap against database records, not a client-supplied count.
  const bookedCount = await validateMaximumTickets(pool, accountId, selection.journey, requested);
  if (bookedCount + requested.length > 4) throw fail('You can select a maximum of 4 tickets for this journey.');
  return {
    journey: selection.journey,
    seats: selection.locks.filter(lock => requested.includes(Number(lock.seat_id))),
    passenger_count: requested.length,
    total: Math.round(selection.locks.filter(lock => requested.includes(Number(lock.seat_id)))
      .reduce((sum, lock) => sum + Number(lock.price), 0) * 100) / 100
  };
};

const createBooking = async (accountId, input) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const journey = await resolveJourney(client, input);
    // Lock the schedule row while the selected locks are validated and ticket/payment are created.
    await client.query(`
      SELECT schedule_id
      FROM schedule
      WHERE schedule_id = $1
      FOR UPDATE
    `, [journey.schedule_id]);
    await expireLocks(client, journey.schedule_id);
    const ids = [...new Set((input.seat_ids || []).map(Number))];
    if (!ids.length || ids.some(id => !Number.isInteger(id) || id <= 0)) throw fail('seat_ids must contain selected seat IDs.');
    const locks = await client.query(`
      SELECT
        sl.*,
        s.seat_number,
        c.type AS seat_type,
        calculate_fare(c.type, $6::numeric - $7::numeric) AS price
      FROM seat_lock sl
      JOIN seat s ON s.seat_id = sl.seat_id
      JOIN coach c ON c.coach_id = s.coach_id
      JOIN fare_rate fr ON fr.seat_type = c.type
      WHERE sl.account_id = $1
        AND sl.schedule_id = $2
        AND sl.status = 'active'
        AND sl.expires_at > clock_timestamp()
        AND sl.from_seq = $3
        AND sl.to_seq = $4
        AND sl.seat_id = ANY($5::int[])
      FOR UPDATE OF sl
    `, [accountId, journey.schedule_id, journey.from_seq, journey.to_seq, ids, journey.to_distance, journey.from_distance]);
    if (locks.rowCount !== ids.length) throw fail('One or more selected seats are no longer locked by you or the lock expired.', 409);
    const booked = await client.query(`
      SELECT 1
      FROM ticket_seat
      WHERE schedule_id = $1
        AND seat_id = ANY($2::int[])
        AND int4range(from_seq, to_seq) && int4range($3::int, $4::int)
      LIMIT 1
    `, [journey.schedule_id, ids, journey.from_seq, journey.to_seq]);
    if (booked.rowCount) throw fail('One or more selected seats have already been booked.', 409);
    const used = await validateMaximumTickets(client, accountId, journey, ids);
    if (used + ids.length > 4) throw fail('You can select a maximum of 4 tickets for this journey.');
    const rounded = locks.rows.reduce((sum, row) => sum + Number(row.price), 0);
    // Keep the ticket pending and do not write ticket_seat rows until payment succeeds.
    const ticket = await client.query(`
      INSERT INTO ticket (schedule_id, account_id, no_of_seats, status, from_station_id, to_station_id)
      VALUES ($1, $2, $3, 'pending', $4, $5)
      RETURNING *
    `, [journey.schedule_id, accountId, ids.length, journey.from_station_id, journey.to_station_id]);
    const payment = await client.query(`
      INSERT INTO payment (ticket_id, amount, status)
      VALUES ($1, $2, 'pending')
      RETURNING *
    `, [ticket.rows[0].ticket_id, rounded]);
    await client.query('COMMIT');
    return { ticket: ticket.rows[0], payment: payment.rows[0], seats: locks.rows.map(row => ({ seat_id: row.seat_id, seat_number: row.seat_number, seat_type: row.seat_type, price: Number(row.price), lock_expires_at: row.expires_at })), total: rounded };
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
};

const confirmPayment = async (accountId, ticketId, method) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Lock the purchaser-owned ticket so concurrent payment confirmations remain idempotent.
    const ticketResult = await client.query(`
      SELECT tk.*, sch.route_id
      FROM ticket tk
      JOIN schedule sch ON sch.schedule_id = tk.schedule_id
      WHERE tk.ticket_id = $1
        AND tk.account_id = $2
      FOR UPDATE
    `, [ticketId, accountId]);
    if (!ticketResult.rowCount) throw fail('Ticket not found.', 404);
    const ticket = ticketResult.rows[0];
    if (ticket.status === 'booked') {
      const existing = await client.query(`
        SELECT *
        FROM payment
        WHERE ticket_id = $1
      `, [ticketId]);
      await client.query('COMMIT');
      return { ticket, payment: existing.rows[0] };
    }
    const seq = await client.query(`
      SELECT
        a.sequence_no AS from_seq,
        b.sequence_no AS to_seq
      FROM route_station a
      JOIN route_station b ON b.route_id = a.route_id
      WHERE a.route_id = $1
        AND a.station_id = $2
        AND b.station_id = $3
        AND a.sequence_no < b.sequence_no
    `, [ticket.route_id, ticket.from_station_id, ticket.to_station_id]);
    if (!seq.rowCount) throw fail('Ticket journey is invalid.');
    const locks = await client.query(`
      SELECT sl.seat_id
      FROM seat_lock sl
      WHERE sl.account_id = $1
        AND sl.schedule_id = $2
        AND sl.status = 'active'
        AND sl.expires_at > clock_timestamp()
        AND sl.from_seq = $3
        AND sl.to_seq = $4
      FOR UPDATE
    `, [accountId, ticket.schedule_id, seq.rows[0].from_seq, seq.rows[0].to_seq]);
    if (locks.rowCount !== Number(ticket.no_of_seats)) throw fail('Seat locks expired or are no longer valid.', 409);
    const seats = await client.query(`
      SELECT
        sl.seat_id,
        sl.from_seq,
        sl.to_seq,
        s.seat_number,
        c.type,
        calculate_fare(c.type, rs2.distance_km - rs1.distance_km) AS price
      FROM seat_lock sl
      JOIN seat s ON s.seat_id = sl.seat_id
      JOIN coach c ON c.coach_id = s.coach_id
      JOIN fare_rate fr ON fr.seat_type = c.type
      JOIN schedule sch ON sch.schedule_id = sl.schedule_id
      JOIN route_station rs1
        ON rs1.route_id = sch.route_id
        AND rs1.sequence_no = sl.from_seq
      JOIN route_station rs2
        ON rs2.route_id = sch.route_id
        AND rs2.sequence_no = sl.to_seq
      WHERE sl.account_id = $1
        AND sl.schedule_id = $2
        AND sl.status = 'active'
        AND sl.expires_at > clock_timestamp()
        AND sl.from_seq = $3
        AND sl.to_seq = $4
      FOR UPDATE OF sl
    `, [accountId, ticket.schedule_id, seq.rows[0].from_seq, seq.rows[0].to_seq]);
    // Recalculate the authoritative total immediately before finalizing payment.
    const total = seats.rows.reduce((sum, seat) => sum + Number(seat.price), 0);
    const payment = await client.query(`
      UPDATE payment
      SET amount = $2,
          method = $3,
          status = 'paid',
          paid_at = NOW()
      WHERE ticket_id = $1
      RETURNING *
    `, [ticketId, total, method || 'simulated']);
    await client.query(`
      UPDATE ticket
      SET status = 'booked'
      WHERE ticket_id = $1
    `, [ticketId]);
    for (const seat of seats.rows) {
      await client.query(`
        INSERT INTO ticket_seat (ticket_id, seat_id, schedule_id, from_seq, to_seq)
        VALUES ($1, $2, $3, $4, $5)
      `, [ticketId, seat.seat_id, ticket.schedule_id, seat.from_seq, seat.to_seq]);
      await client.query(`
        UPDATE seat_lock
        SET status = 'confirmed'
        WHERE seat_id = $1
          AND account_id = $2
          AND schedule_id = $3
          AND from_seq = $4
          AND to_seq = $5
          AND status = 'active'
      `, [seat.seat_id, accountId, ticket.schedule_id, seat.from_seq, seat.to_seq]);
    }
    await client.query('COMMIT');
    return { ticket: { ...ticket, status:'booked' }, payment: payment.rows[0] };
  } catch (error) { await client.query('ROLLBACK'); if (error.code==='23P01') throw fail('A selected seat is no longer available.',409); throw error; } finally { client.release(); }
};

const getTicket = async (accountId, ticketId) => {
  // Restrict lookup to the purchaser and derive seat, fare, and payment data from confirmed records.
  const result = await pool.query(`
    SELECT
      tk.ticket_id,
      tk.no_of_seats,
      tk.status,
      tk.schedule_id,
      tk.from_station_id,
      tk.to_station_id,
      a.name AS purchaser_name,
      t.train_name,
      sch.date,
      sch.starting_time,
      origin.departure_time AS origin_departure_time,
      destination.arrival_time AS destination_arrival_time,
      sf.station_name AS from_station,
      st.station_name AS to_station,
      p.payment_id,
      p.amount,
      p.method,
      p.status AS payment_status,
      p.paid_at,
      COALESCE(
        json_agg(
          json_build_object(
            'seat_id', s.seat_id,
            'seat_number', s.seat_number,
            'coach', c.coach_name,
            'seat_type', c.type,
            'price', calculate_fare(c.type, rs2.distance_km - rs1.distance_km)
          ) ORDER BY s.seat_number
        ) FILTER (WHERE s.seat_id IS NOT NULL),
        '[]'
      ) AS seats
    FROM ticket tk
    JOIN account a ON a.account_id = tk.account_id
    JOIN schedule sch ON sch.schedule_id = tk.schedule_id
    JOIN train t ON t.train_id = sch.train_id
    JOIN station sf ON sf.station_id = tk.from_station_id
    JOIN station st ON st.station_id = tk.to_station_id
    LEFT JOIN route_station origin
      ON origin.route_id = sch.route_id
      AND origin.station_id = tk.from_station_id
    LEFT JOIN route_station destination
      ON destination.route_id = sch.route_id
      AND destination.station_id = tk.to_station_id
    LEFT JOIN payment p ON p.ticket_id = tk.ticket_id
    LEFT JOIN ticket_seat ts ON ts.ticket_id = tk.ticket_id
    LEFT JOIN seat s ON s.seat_id = ts.seat_id
    LEFT JOIN coach c ON c.coach_id = s.coach_id
    LEFT JOIN fare_rate fr ON fr.seat_type = c.type
    LEFT JOIN route_station rs1
      ON rs1.route_id = sch.route_id
      AND rs1.sequence_no = ts.from_seq
    LEFT JOIN route_station rs2
      ON rs2.route_id = sch.route_id
      AND rs2.sequence_no = ts.to_seq
    WHERE tk.ticket_id = $1
      AND tk.account_id = $2
    GROUP BY
      tk.ticket_id,
      a.name,
      t.train_name,
      sch.date,
      sch.starting_time,
      origin.departure_time,
      destination.arrival_time,
      sf.station_name,
      st.station_name,
      p.payment_id
  `, [ticketId, accountId]);
  if (!result.rowCount) throw fail('Ticket not found.',404);
  return result.rows[0];
};

const getMyTickets = async (accountId) => {
  const timezone = process.env.SCHEDULE_TIMEZONE || 'Asia/Dhaka';
  const result = await pool.query(`
    SELECT
      tk.ticket_id,
      tk.no_of_seats,
      tk.status,
      sch.schedule_id,
      sch.date,
      sch.starting_time,
      t.train_name,
      sf.station_name AS from_station,
      st.station_name AS to_station,
      origin.departure_time AS origin_departure_time,
      destination.arrival_time AS destination_arrival_time,
      p.amount,
      p.method,
      p.status AS payment_status,
      CASE
        WHEN sch.date < (CURRENT_TIMESTAMP AT TIME ZONE $2)::date THEN 'travelled'
        ELSE 'upcoming'
      END AS journey_period
    FROM ticket tk
    JOIN schedule sch ON sch.schedule_id = tk.schedule_id
    JOIN train t ON t.train_id = sch.train_id
    JOIN station sf ON sf.station_id = tk.from_station_id
    JOIN station st ON st.station_id = tk.to_station_id
    LEFT JOIN route_station origin
      ON origin.route_id = sch.route_id AND origin.station_id = tk.from_station_id
    LEFT JOIN route_station destination
      ON destination.route_id = sch.route_id AND destination.station_id = tk.to_station_id
    LEFT JOIN payment p ON p.ticket_id = tk.ticket_id
    WHERE tk.account_id = $1
      AND tk.status IN ('booked', 'completed', 'cancelled')
    ORDER BY sch.date ASC, sch.starting_time ASC, tk.ticket_id ASC
  `, [accountId, timezone]);

  return {
    upcoming: result.rows.filter((ticket) => ticket.journey_period === 'upcoming'),
    travelled: result.rows.filter((ticket) => ticket.journey_period === 'travelled')
  };
};

const cancelTicket = async (accountId, ticketId) => withTransaction(async (client) => {
  const timezone = process.env.SCHEDULE_TIMEZONE || 'Asia/Dhaka';
  const ticketResult = await client.query(`
    SELECT
      tk.ticket_id,
      tk.status AS ticket_status,
      p.status AS payment_status,
      sch.date >= (CURRENT_TIMESTAMP AT TIME ZONE $3)::date AS is_upcoming
    FROM ticket tk
    JOIN schedule sch ON sch.schedule_id = tk.schedule_id
    JOIN payment p ON p.ticket_id = tk.ticket_id
    WHERE tk.ticket_id = $1
      AND tk.account_id = $2
    FOR UPDATE OF tk, sch, p
  `, [ticketId, accountId, timezone]);

  if (!ticketResult.rowCount) throw fail('Ticket not found.', 404);
  const ticket = ticketResult.rows[0];
  if (ticket.ticket_status === 'cancelled') {
    return { ticket_id: ticket.ticket_id, status: 'cancelled', payment_status: ticket.payment_status };
  }
  if (!ticket.is_upcoming) throw fail('Travelled tickets cannot be cancelled.', 409);
  if (ticket.ticket_status !== 'booked' || ticket.payment_status !== 'paid') {
    throw fail('Only paid, confirmed tickets can be cancelled.', 409);
  }

  await client.query(`
    UPDATE payment
    SET status = 'refunded'
    WHERE ticket_id = $1
  `, [ticketId]);
  await client.query(`
    UPDATE seat_lock sl
    SET status = 'expired'
    FROM ticket_seat ts
    WHERE ts.ticket_id = $1
      AND sl.seat_id = ts.seat_id
      AND sl.schedule_id = ts.schedule_id
      AND sl.from_seq = ts.from_seq
      AND sl.to_seq = ts.to_seq
      AND sl.status = 'confirmed'
  `, [ticketId]);
  await client.query('DELETE FROM ticket_seat WHERE ticket_id = $1', [ticketId]);
  await client.query(`
    UPDATE ticket
    SET status = 'cancelled'
    WHERE ticket_id = $1
  `, [ticketId]);

  return { ticket_id: ticketId, status: 'cancelled', payment_status: 'refunded' };
});

module.exports = { getAvailableSeats, addSeatLock, removeSeatLock, getUserActiveLocks, validateSelection, createBooking, confirmPayment, getTicket, getMyTickets, cancelTicket };
