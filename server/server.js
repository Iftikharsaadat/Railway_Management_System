const express = require("express");
const cors = require("cors");
const pool = require("./db");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes"); // import the login and reg route

const app = express();

app.use(cors());
app.use(express.json());//sob request egular moddho diye asbe

// app.use((req, res, next) => {
//   console.log("---------------------------");
//   console.log(`RECEIVED: ${req.method} ${req.url}`);
//   console.log("BODY:", req.body);
//   next();
// });
// Routes
app.use("/api/auth", authRoutes); //jesob request /api/auth diye asbe segula authroutes er route diye asbe

// Test route
app.get("/", (req, res) => {
  res.send("Railway API Running");
});

app.get("/test-db", async (req, res) => {
  const pool = require("./db");
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//search

app.post("/api/search", async(req, res) =>{
  try {
    // const { from, to, date } = req.body; 

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
    res.json({
      availableTrains : Trains.rows,
      availableRoute : Route.rows
    });
  } catch (err) {
    console.error(err.message);
  }
  
});


//train details

// app.get("/api/train_details/:train_id", (req, res)=>{
//   try {
//     console.log("inside get");
//     res.json("hello");
//   } catch (err) {
//     console.error(err.message);
    
//   }
// })
app.get("/api/train_details/:train_id", async(req, res)=>{
  try {
    const {train_id} = req.params;
    const {from, to, date} = req.query;
    console.log(req.params);
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
    res.json({
      route: Route.rows,
      types: Types.rows,
      coaches: Coaches.rows,
      seats: Seats.rows
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});