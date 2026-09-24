const express = require('express');
const router = express.Router();
const trainController = require("../controllers/trainController");
const verifyToken = require("../middlewares/authMiddleware");
const adminOnly = require("../middlewares/adminMiddleware");

router.post("/addTrain", verifyToken, adminOnly, trainController.addTrain);
router.post("/addTrainWithRoute", verifyToken, adminOnly, trainController.addTrainWithRoute);
router.post("/addRoute", verifyToken, adminOnly, trainController.addRoute);
router.post("/addStation", verifyToken, adminOnly, trainController.addStation);
router.post("/addStationToRoute", verifyToken, adminOnly, trainController.addStationToRoute);
router.post("/addCoach", verifyToken, adminOnly, trainController.addCoach);
router.post("/addSeat", verifyToken, adminOnly, trainController.addSeat);
router.post("/addCoordinates", verifyToken, adminOnly, trainController.addCoordinates);
router.post("/addTrackingTime", verifyToken, adminOnly, trainController.addTrackingTime);

router.put("/updateTrain/:trainId", verifyToken, adminOnly, trainController.updateTrain);
router.put("/updateStation/:stationId", verifyToken, adminOnly, trainController.updateStation);
router.put("/updateRoute/:routeId", verifyToken, adminOnly, trainController.updateRoute);
router.put("/updateCoach/:coachId", verifyToken, adminOnly, trainController.updateCoach);
router.put("/updateSchedule/:scheduleId", verifyToken, adminOnly, trainController.updateSchedule);

router.post("/search", trainController.searchTrains);
router.get("/train_details/:train_id", trainController.showDetails);

router.get("/admin/overview", verifyToken, adminOnly, trainController.adminOverview);
router.get("/admin/routes/:routeId", verifyToken, adminOnly, trainController.routeDetails);
router.get("/admin/trains/:trainId/coaches", verifyToken, adminOnly, trainController.trainCoaches);
router.get("/admin/coaches/:coachId/seats", verifyToken, adminOnly, trainController.coachSeats);

router.delete("/deleteTrain/:train_id", verifyToken, adminOnly, trainController.deleteTrain);
router.delete("/deleteCoach/:coach_id", verifyToken, adminOnly, trainController.deleteCoach);
router.delete("/deleteRoute/:route_id", verifyToken, adminOnly, trainController.deleteRoute);
router.delete("/deleteSchedule/:schedule_id", verifyToken, adminOnly, trainController.deleteSchedule);
router.delete("/deleteStation/:station_id", verifyToken, adminOnly, trainController.deleteStation);

module.exports = router;