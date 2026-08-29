const express = require('express');
const router = express.Router();
const trainController = require("../controllers/trainController");

router.post("/search", trainController.searchTrains);
router.get("/train_details/:train_id", trainController.showDetails);

module.exports = router;