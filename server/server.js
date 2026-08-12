const express = require("express");
const cors = require("cors");
const pool = require("./db");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes"); // import the login and reg route

const app = express();

app.use(cors());
app.use(express.json());//sob request egular moddho diye asbe

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
    const { from, to, date } = req.body; 

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
app.get("/api/train_details/:train_id", async(req, res)=>{
  try {
    const {train_id} = req.params;
    const {from, to, date} = req.body;
    const qRoute = `
    SELECT rs.sequence_no, s.station_name
    FROM train t
    JOIN route_station rs ON rs.route_id = t.route_id
    JOIN station s on rs.station_id = s.station_id
    WHERE train_id = $1
    `;

    const qSeats = ``;
    const Route  = await pool.query(qRoute, [train_id]);
    // const [Route, Seats] = await Promise.all([
    //   pool.query(qRoute, [train_id]),
    //   pool.query(qSeats, [])
    // ]);
    res.json(Route.rows);
  } catch (err) {
    console.error(err.message);
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});