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
    res.status(500).json({ error: "Internal Server Error" });
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

const addTrain = async (req, res) => {
  try {
    const { train_name: trainName, route_id: routeId } = req.body;

    if (!trainName || !routeId) {
      return res.status(400).json({ error: "train_name and route_id are required" });
    }

    const train = await trainService.addTrain(trainName, routeId);
    res.status(201).json({ message: "Train added successfully", train });
  } catch (err) {
    console.error("Add Train Error:", err.message);
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

module.exports = {
  addTrain,
  addRoute,
  addStation,
  addStationToRoute,
  addCoach,
  addSeat,
  addCoordinates,
  addTrackingTime,
  searchTrains,
  showDetails
};