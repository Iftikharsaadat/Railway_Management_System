const trainService = require('../services/trainService');

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

module.exports = { searchTrains, showDetails};