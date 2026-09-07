import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addRoute } from "../services/api";

function AddRoute() {
  const navigate = useNavigate();

  const [startStationId, setStartStationId] = useState("");
  const [endStationId, setEndStationId] = useState("");

  const [stations, setStations] = useState([
    {
      station_id: "",
      sequence_no: "",
      arrival_time: "",
      departure_time: "",
      distance_km: "",
    },
  ]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const addStationRow = () => {
    setStations([
      ...stations,
      {
        station_id: "",
        sequence_no: "",
        arrival_time: "",
        departure_time: "",
        distance_km: "",
      },
    ]);
  };

  const removeStationRow = (index) => {
    const updated = stations.filter((_, i) => i !== index);
    setStations(updated);
  };

  const updateStation = (index, field, value) => {
    const updated = [...stations];

    updated[index][field] = value;

    setStations(updated);
  };

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

      const formattedStations = stations.map((station) => ({
        station_id: Number(station.station_id),
        sequence_no: Number(station.sequence_no),
        arrival_time: station.arrival_time || null,
        departure_time: station.departure_time || null,
        distance_km: Number(station.distance_km),
      }));

      const data = await addRoute(
        Number(startStationId),
        Number(endStationId),
        formattedStations,
        token
      );

      console.log("Route added:", data);

      setMessage(
        `Route added successfully! Route ID: ${
          data.route?.route_id || "created"
        }`
      );

      setStartStationId("");
      setEndStationId("");

      setStations([
        {
          station_id: "",
          sequence_no: "",
          arrival_time: "",
          departure_time: "",
          distance_km: "",
        },
      ]);

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

        <h1>Add Route</h1>

        <p>
          Create a route and add its stations.
        </p>

      </div>

      <div className="admin-form-card">

        <form onSubmit={handleSubmit}>

          <div className="form-row">

            <div className="form-group">
              <label>Start Station ID</label>

              <input
                type="number"
                placeholder="e.g. 1"
                value={startStationId}
                onChange={(e) =>
                  setStartStationId(e.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label>End Station ID</label>

              <input
                type="number"
                placeholder="e.g. 5"
                value={endStationId}
                onChange={(e) =>
                  setEndStationId(e.target.value)
                }
                required
              />
            </div>

          </div>


          <h3 className="section-title">
            Route Stations
          </h3>


          {stations.map((station, index) => (

            <div
              className="route-station-box"
              key={index}
            >

              <div className="route-station-title">
                Station {index + 1}
              </div>

              <div className="form-row">

                <div className="form-group">
                  <label>Station ID</label>

                  <input
                    type="number"
                    value={station.station_id}
                    onChange={(e) =>
                      updateStation(
                        index,
                        "station_id",
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Sequence No</label>

                  <input
                    type="number"
                    value={station.sequence_no}
                    onChange={(e) =>
                      updateStation(
                        index,
                        "sequence_no",
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

              </div>


              <div className="form-row">

                <div className="form-group">
                  <label>Arrival Time</label>

                  <input
                    type="time"
                    value={station.arrival_time}
                    onChange={(e) =>
                      updateStation(
                        index,
                        "arrival_time",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Departure Time</label>

                  <input
                    type="time"
                    value={station.departure_time}
                    onChange={(e) =>
                      updateStation(
                        index,
                        "departure_time",
                        e.target.value
                      )
                    }
                  />
                </div>

              </div>


              <div className="form-group">
                <label>Distance (km)</label>

                <input
                  type="number"
                  step="0.01"
                  value={station.distance_km}
                  onChange={(e) =>
                    updateStation(
                      index,
                      "distance_km",
                      e.target.value
                    )
                  }
                  required
                />
              </div>


              {stations.length > 1 && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() =>
                    removeStationRow(index)
                  }
                >
                  Remove Station
                </button>
              )}

            </div>

          ))}


          <button
            type="button"
            className="secondary-btn"
            onClick={addStationRow}
          >
            + Add Another Station
          </button>


          <button
            type="submit"
            className="admin-submit-btn"
          >
            Create Route
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

export default AddRoute;