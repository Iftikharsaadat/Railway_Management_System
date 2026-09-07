import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addStation } from "../services/api";

function AddStation() {
  const navigate = useNavigate();

  const [stationName, setStationName] = useState("");
  const [city, setCity] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login first.");
        return;
      }

      const data = await addStation(
        stationName,
        city,
        token
      );

      console.log("Station added:", data);

      setMessage(
        `Station added successfully! Station ID: ${
          data.station?.station_id || data.station_id || "created"
        }`
      );

      setStationName("");
      setCity("");

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-page">

      <div className="admin-page-header">
        <button
          className="back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Back
        </button>

        <h1>Add Station</h1>
        <p>Create a new railway station.</p>
      </div>

      <div className="admin-form-card">

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Station Name</label>

            <input
              type="text"
              placeholder="e.g. Dhaka"
              value={stationName}
              onChange={(e) => setStationName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>City</label>

            <input
              type="text"
              placeholder="e.g. Dhaka"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="admin-submit-btn">
            Add Station
          </button>

        </form>

        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

      </div>
    </div>
  );
}

export default AddStation;