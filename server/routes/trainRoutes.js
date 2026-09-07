const express = require('express');
const router = express.Router();
const trainController = require("../controllers/trainController");
const verifyToken = require("../middlewares/authMiddleware");
const adminOnly = require("../middlewares/adminMiddleware");

router.post("/addTrain", verifyToken, adminOnly, trainController.addTrain);
router.post("/addRoute", verifyToken, adminOnly, trainController.addRoute);
router.post("/addStation", verifyToken, adminOnly, trainController.addStation);
router.post("/addStationToRoute", verifyToken, adminOnly, trainController.addStationToRoute);
router.post("/addCoach", verifyToken, adminOnly, trainController.addCoach);
router.post("/addSeat", verifyToken, adminOnly, trainController.addSeat);
router.post("/addCoordinates", verifyToken, adminOnly, trainController.addCoordinates);
router.post("/addTrackingTime", verifyToken, adminOnly, trainController.addTrackingTime);

router.post("/search", trainController.searchTrains);
router.get("/train_details/:train_id", trainController.showDetails);

module.exports = router;