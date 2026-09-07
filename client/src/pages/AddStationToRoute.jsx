import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addStationToRoute } from "../services/api";

function AddStationToRoute() {
  const navigate = useNavigate();

  const [routeId, setRouteId] = useState("");
  const [stationId, setStationId] = useState("");
  const [sequenceNo, setSequenceNo] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [distanceKm, setDistanceKm] = useState("");

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

      const data = await addStationToRoute(
        Number(routeId),
        Number(stationId),
        Number(sequenceNo),
        arrivalTime || null,
        departureTime || null,
        Number(distanceKm),
        token
      );

      console.log(data);

      setMessage(
        "Station successfully added to route!"
      );

      setRouteId("");
      setStationId("");
      setSequenceNo("");
      setArrivalTime("");
      setDepartureTime("");
      setDistanceKm("");

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

        <h1>Add Station To Route</h1>

        <p>
          Add an existing station to an existing route.
        </p>

      </div>


      <div className="admin-form-card">

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Route ID</label>

            <input
              type="number"
              placeholder="e.g. 1"
              value={routeId}
              onChange={(e) =>
                setRouteId(e.target.value)
              }
              required
            />
          </div>


          <div className="form-group">
            <label>Station ID</label>

            <input
              type="number"
              placeholder="e.g. 3"
              value={stationId}
              onChange={(e) =>
                setStationId(e.target.value)
              }
              required
            />
          </div>


          <div className="form-group">
            <label>Sequence No</label>

            <input
              type="number"
              placeholder="e.g. 2"
              value={sequenceNo}
              onChange={(e) =>
                setSequenceNo(e.target.value)
              }
              required
            />
          </div>


          <div className="form-row">

            <div className="form-group">
              <label>Arrival Time</label>

              <input
                type="time"
                value={arrivalTime}
                onChange={(e) =>
                  setArrivalTime(e.target.value)
                }
              />
            </div>


            <div className="form-group">
              <label>Departure Time</label>

              <input
                type="time"
                value={departureTime}
                onChange={(e) =>
                  setDepartureTime(e.target.value)
                }
              />
            </div>

          </div>


          <div className="form-group">
            <label>Distance (km)</label>

            <input
              type="number"
              step="0.01"
              placeholder="e.g. 45.5"
              value={distanceKm}
              onChange={(e) =>
                setDistanceKm(e.target.value)
              }
              required
            />
          </div>


          <button
            type="submit"
            className="admin-submit-btn"
          >
            Add Station To Route
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

export default AddStationToRoute;
