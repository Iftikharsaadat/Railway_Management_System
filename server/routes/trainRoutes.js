const express = require('express');
const router = express.Router();
const trainController = require("../controllers/trainController");
const verifyToken = require("../middlewares/authMiddleware");
const adminOnly = require("../middlewares/adminMiddleware");

router.post("/addTrain", verifyToken, adminOnly, trainController.addTrain);
router.post("/addRoute", verifyToken, adminOnly, trainController.addRoute);
router.post("/addStation", verifyToken, adminOnly, trainController.addStation);
router.post("/addStationToRoute", verifyToken, adminOnly, trainController.addStationToRoute);
router.delete("/deleteStationFromRoute/:route_id/:station_id", verifyToken, adminOnly, trainController.deleteStationFromRoute);
router.post("/addCoach", verifyToken, adminOnly, trainController.addCoach);
router.post("/addSeat", verifyToken, adminOnly, trainController.addSeat);
router.post("/addCoordinates", verifyToken, adminOnly, trainController.addCoordinates);
router.post("/addTrackingTime", verifyToken, adminOnly, trainController.addTrackingTime);
router.post("/addSchedule", verifyToken, adminOnly, trainController.addSchedule);

router.put("/updateTrain/:trainId", verifyToken, adminOnly, trainController.updateTrain);
router.put("/updateStation/:stationId", verifyToken, adminOnly, trainController.updateStation);
router.put("/updateRouteStation/:route_id/:station_id", verifyToken, adminOnly, trainController.updateRouteStation);
router.put("/updateRoute/:routeId", verifyToken, adminOnly, trainController.updateRoute);
router.put("/updateCoach/:coachId", verifyToken, adminOnly, trainController.updateCoach);
router.put("/updateSchedule/:scheduleId", verifyToken, adminOnly, trainController.updateSchedule);
router.get("/admin/trains", verifyToken, adminOnly, trainController.showTrainsAdmin);
router.get("/admin/stations", verifyToken, adminOnly, trainController.showStationsAdmin);
router.get("/admin/trains/:train_id/coaches", verifyToken, adminOnly, trainController.showCoachesAdmin);
router.get("/admin/schedules/:schedule_id", verifyToken, adminOnly, trainController.showSchedule);
router.get("/route/:route_id", verifyToken, adminOnly, trainController.showRoute);

router.post("/search", trainController.searchTrains);
router.get("/train_details/:train_id", trainController.showDetails);


router.delete("/deleteTrain/:train_id", verifyToken, adminOnly, trainController.deleteTrain);
router.delete("/deleteCoach/:coach_id", verifyToken, adminOnly, trainController.deleteCoach);
router.delete("/deleteRoute/:route_id", verifyToken, adminOnly, trainController.deleteRoute);
router.delete("/deleteSchedule/:schedule_id", verifyToken, adminOnly, trainController.deleteSchedule);
router.delete("/deleteStation/:station_id", verifyToken, adminOnly, trainController.deleteStation);

module.exports = router;