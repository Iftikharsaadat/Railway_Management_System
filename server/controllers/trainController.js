const trainService = require('../services/trainService');

const addCoach = async (req, res) => {
  try {
    const { train_id: trainId, coach_name: coachName, seats, type } = req.body;

    if (!trainId || !coachName || !seats || !type) {
      return res.status(400).json({ error: "train_id, coach_name, seats, and type are required" });
    }

    const result = await trainService.addCoach(trainId, coachName, seats, type);
    res.status(201).json({
      message: "Coach and seats added successfully",
      coach: result.coach,
      seats: result.seats
    });
  } catch (err) {
    console.error("Add Coach Error", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const addStationToRoute = async (req, res) => {
  try {
    const {
      route_id: routeId,
      station_id: stationId,
      sequence_no: sequenceNo,
      arrival_time: arrivalTime,
      departure_time: departureTime,
      distance_km: distanceKm
    } = req.body;

    if (routeId == null || stationId == null || sequenceNo == null || distanceKm == null) {
      return res.status(400).json({
        error: "route_id, station_id, sequence_no, and distance_km are required"
      });
    }

    const routeStation = await trainService.addStationToRoute(
      routeId,
      stationId,
      sequenceNo,
      arrivalTime,
      departureTime,
      distanceKm
    );
    res.status(201).json({ message: "Station added to route successfully", routeStation });
  } catch (err) {
    console.error("Add Station To Route Error", err.message);
    res.status(err.statusCode || 500).json({
      error: err.statusCode ? err.message : "Internal Server Error"
    });
  }
};
const addSeat = async (req, res) => {
  try {
    const {
      coach_id: coachId,
      seat_number: seatNumber,
      direction,
      reservation_status: reservationStatus
    } = req.body;

    if (coachId == null || !seatNumber || !direction) {
      return res.status(400).json({
        error: "coach_id, seat_number, and direction are required"
      });
    }

    const seat = await trainService.addSeat(coachId, seatNumber, direction, reservationStatus);
    res.status(201).json({ message: "Seat added successfully", seat });
  } catch (err) {
    console.error("Add Seat Error", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const addCoordinates = async (req, res) => {
  try {
    const {
      coordinates,
      actual_time: actualTime,
      delay_minutes: delayMinutes,
      status,
      tracking_id: trackingId
    } = req.body;

    if (!coordinates || !actualTime || delayMinutes === undefined || !status || !trackingId) {
      return res.status(400).json({ error: "coordinates, actual_time, delay_minutes, status, and tracking_id are required" });
    }

    const tracking = await trainService.updateTrainTracking(
      coordinates,
      actualTime,
      delayMinutes,
      status,
      trackingId
    );
    res.status(200).json({ message: "Train tracking updated successfully", tracking });
  } catch (err) {
    console.error("Add Coordinates Error", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const addRoute = async (req, res) => {
  try {
    const {
      start_station_id: startStationId,
      end_station_id: endStationId,
      stations = []
    } = req.body;

    if (!startStationId || !endStationId) {
      return res.status(400).json({ error: "start_station_id and end_station_id are required" });
    }

    if (!Array.isArray(stations) || stations.some((station) => (
      station.station_id == null ||
      station.sequence_no == null ||
      station.distance_km == null
    ))) {
      return res.status(400).json({
        error: "stations must be an array with station_id, sequence_no, and distance_km"
      });
    }

    const result = await trainService.addRoute(startStationId, endStationId, stations);
    res.status(201).json({
      message: "Route and stations added successfully",
      route: result.route,
      routeStations: result.routeStations
    });
  } catch (err) {
    console.error("Add Route Error", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const addStation = async (req, res) => {
  try {
    const { station_name: stationName, city: cityName } = req.body;
    if (!stationName || !cityName) {
      return res.status(400).json({ error: "station_name and city are required" });
    }

    const station = await trainService.addStation(stationName, cityName);
    res.status(201).json({ message: "Station added successfully", station });
  } catch (err) {
    console.error("Add Station Error", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const addTrackingTime = async (req, res) => {
  try {
    const {
      schedule_id: scheduleId,
      station_id: stationId,
      expected_time: expectedTime,
      status
    } = req.body;

    if (!scheduleId || !stationId || !expectedTime || !status) {
      return res.status(400).json({ error: "schedule_id, station_id, expected_time, and status are required" });
    }

    const tracking = await trainService.addTrackingTime(scheduleId, stationId, expectedTime, status);
    res.status(201).json({ message: "Tracking time added successfully", tracking });
  } catch (err) {
    console.error("Add TrackingTime Error", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addSchedule = async (req, res) => {
  try {
    const {
      train_id: trainId,
      route_id: routeId,
      date,
      starting_time: startingTime,
      station_id: stationId
    } = req.body;

    if (trainId == null || routeId == null || !date || stationId == null) {
      return res.status(400).json({
        error: "train_id, route_id, date, and station_id are required"
      });
    }

    const schedule = await trainService.addSchedule(
      trainId,
      routeId,
      date,
      startingTime,
      stationId
    );

    res.status(201).json({
      message: "Schedule added successfully",
      schedule
    });
  } catch (err) {
    console.error("Add Schedule Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addTrain = async (req, res) => {
  try {
    const { train_name: trainName, route_id: routeId, off_day: offDay } = req.body;

    if (!trainName || !routeId) {
      return res.status(400).json({ error: "train_name and route_id are required" });
    }

    const train = await trainService.addTrain(trainName, routeId, offDay);
    res.status(201).json({ message: "Train added successfully", train });
  } catch (err) {
    console.error("Add Train Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateTrain = async(req, res) =>{
  try{
    const {trainId} = req.params;
    const { train_name: trainName, off_day: offDay } = req.body;

    const updateRes = await trainService.updateTrain(trainName, offDay, trainId);
    if (!updateRes) {
      return res.status(404).json({ error: "Train not found" });
    }
    res.status(200).json({ message: "Train updated successfully", train: updateRes });
  } catch (err) {
    console.error("Update Train Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateStation = async (req, res) => {
  try {
    const { stationId } = req.params;
    const { station_name: stationName, city } = req.body;
    const station = await trainService.updateStation(stationName, city, stationId);

    if (!station) {
      return res.status(404).json({ error: "Station not found" });
    }
    res.status(200).json({ message: "Station updated successfully", station });
  } catch (err) {
    console.error("Update Station Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { stations } = req.body;

    if (!Array.isArray(stations) || stations.length < 2) {
      return res.status(400).json({
        error: "stations must contain at least two stations in route order"
      });
    }

    const hasInvalidStation = stations.some((station) => (
      station.station_id == null ||
      station.distance_km == null
    ));
    const stationIds = stations.map((station) => station.station_id);
    const hasDuplicateStation = new Set(stationIds).size !== stationIds.length;

    if (hasInvalidStation || hasDuplicateStation) {
      return res.status(400).json({
        error: "Each station needs a unique station_id and distance_km"
      });
    }

    const route = await trainService.updateRoute(routeId, stations);

    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }
    res.status(200).json({
      message: "Route stations updated successfully",
      route: route.route,
      routeStations: route.routeStations
    });
  } catch (err) {
    console.error("Update Route Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateCoach = async (req, res) => {
  try {
    const { coachId } = req.params;
    const {
      coach_name: coachName,
      seats,
      type
    } = req.body;
    const coach = await trainService.updateCoach(coachName, seats, type, coachId);

    if (!coach) {
      return res.status(404).json({ error: "Coach not found" });
    }
    res.status(200).json({ message: "Coach updated successfully", coach });
  } catch (err) {
    console.error("Update Coach Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const {
      train_id: trainId,
      route_id: routeId,
      date,
      starting_time: startingTime,
      station_id: stationId
    } = req.body;
    const schedule = await trainService.updateSchedule(
      trainId,
      routeId,
      date,
      startingTime,
      stationId,
      scheduleId
    );

    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }
    res.status(200).json({ message: "Schedule updated successfully", schedule });
  } catch (err) {
    console.error("Update Schedule Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const showTrainsAdmin = async (req, res) => {
  try {
    const trains = await trainService.showTrainsAdmin(req.query.search || '');
    res.status(200).json({ trains });
  } catch (err) {
    console.error("Show Admin Trains Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const showRoute = async (req, res) => {
  try {
    const routeId = parseId(req.params.route_id);

    if (!routeId) {
      return res.status(400).json({ error: "Valid route_id is required" });
    }

    const route = await trainService.showRoute(routeId);

    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }

    res.status(200).json(route);
  } catch (err) {
    console.error("Show Route Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const searchTrains = async (req, res) => {
  try {
    const { from, to, date } = req.body;

    // Basic Validation
    if (!from || !to || !date) {
      return res.status(400).json({ error: "Please provide from, to, and date." });
    }

    const searchResults = await trainService.findTrainsByRoute(from, to, date);
    
    res.status(200).json(searchResults);
  } catch (err) {
    console.error("Search Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const showDetails = async (req, res) => {
    try {
        const {train_id} = req.params;
        const {from, to, date} = req.query;
        console.log(req.params);

        const detailInfo = await trainService.showTrainDetails(train_id, from, to, date);

        res.status(200).json(detailInfo)
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
};


const parseId = (value) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
};


// =====================================================
// DELETE TRAIN
// =====================================================

const deleteTrain = async (req, res) => {
  try {

    const trainId = parseId(req.params.train_id);

    if (!trainId) {
      return res.status(400).json({
        error: "Valid train_id is required"
      });
    }

    const train = await trainService.deleteTrain(trainId);

    return res.status(200).json({
      message: `Train "${train.train_name}" and its route deleted successfully`,
      train
    });

  } catch (err) {

    console.error(
      "Delete Train Error:",
      err.message
    );

    return res.status(
      err.statusCode || 500
    ).json({
      error: err.message
    });

  }
};


// =====================================================
// DELETE COACH
// =====================================================

const deleteCoach = async (req, res) => {
  try {

    const coachId = parseId(req.params.coach_id);

    if (!coachId) {
      return res.status(400).json({
        error: "Valid coach_id is required"
      });
    }

    const coach = await trainService.deleteCoach(
      coachId
    );

    return res.status(200).json({
      message: `Coach "${coach.coach_name}" deleted successfully`,
      coach
    });

  } catch (err) {

    console.error(
      "Delete Coach Error:",
      err.message
    );

    return res.status(
      err.statusCode || 500
    ).json({
      error: err.message
    });

  }
};


// =====================================================
// DELETE ROUTE
// =====================================================

const deleteRoute = async (req, res) => {
  try {

    const routeId = parseId(req.params.route_id);

    if (!routeId) {
      return res.status(400).json({
        error: "Valid route_id is required"
      });
    }

    const route = await trainService.deleteRoute(
      routeId
    );

    return res.status(200).json({
      message: `Route ${route.route_id} deleted successfully`,
      route
    });

  } catch (err) {

    console.error(
      "Delete Route Error:",
      err.message
    );

    return res.status(
      err.statusCode || 500
    ).json({
      error: err.message
    });

  }
};


// =====================================================
// DELETE SCHEDULE
// =====================================================

const deleteSchedule = async (req, res) => {
  try {

    const scheduleId = parseId(
      req.params.schedule_id
    );

    if (!scheduleId) {
      return res.status(400).json({
        error: "Valid schedule_id is required"
      });
    }

    const schedule =
      await trainService.deleteSchedule(
        scheduleId
      );

    return res.status(200).json({
      message:
        `Schedule ${schedule.schedule_id} deleted successfully`,
      schedule
    });

  } catch (err) {

    console.error(
      "Delete Schedule Error:",
      err.message
    );

    return res.status(
      err.statusCode || 500
    ).json({
      error: err.message
    });

  }
};


// =====================================================
// DELETE STATION
// =====================================================

const deleteStation = async (req, res) => {
  try {

    const stationId = parseId(
      req.params.station_id
    );

    if (!stationId) {
      return res.status(400).json({
        error: "Valid station_id is required"
      });
    }

    const station =
      await trainService.deleteStation(
        stationId
      );

    return res.status(200).json({
      message:
        `Station "${station.station_name}" deleted successfully`,
      station
    });

  } catch (err) {

    console.error(
      "Delete Station Error:",
      err.message
    );

    return res.status(
      err.statusCode || 500
    ).json({
      error: err.message
    });

  }
};


module.exports = {
  addTrain,
  addRoute,
  addStation,
  addStationToRoute,
  addCoach,
  addSeat,
  addCoordinates,
  addTrackingTime,
  addSchedule,
  updateTrain,
  updateStation,
  updateRoute,
  updateCoach,
  updateSchedule,
  showTrainsAdmin,
  showRoute,
  searchTrains,
  showDetails,
  deleteTrain,
  deleteCoach,
  deleteRoute,
  deleteSchedule,
  deleteStation
};