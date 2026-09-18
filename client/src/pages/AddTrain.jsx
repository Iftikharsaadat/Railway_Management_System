import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addTrain } from "../services/api";

function AddTrain() {
  const navigate = useNavigate();

  const [trainName, setTrainName] = useState("");
  const [routeId, setRouteId] = useState("");
  const [offDay, setOffDay] = useState("");

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

      const data = await addTrain(
        trainName,
        Number(routeId),
        offDay,
        token
      );

      console.log(data);

      setMessage(
        `Train added successfully! Train ID: ${
          data.train?.train_id || data.train_id || "created"
        }`
      );

      setTrainName("");
      setRouteId("");
      setOffDay("");

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

        <h1>Add Train</h1>

        <p>
          Add a new train to an existing route.
        </p>

      </div>


      <div className="admin-form-card">

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Train Name</label>

            <input
              type="text"
              placeholder="e.g. Subarna Express"
              value={trainName}
              onChange={(e) =>
                setTrainName(e.target.value)
              }
              required
            />
          </div>


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
            <label>Weekly Off Day (optional)</label>

            <select value={offDay} onChange={(e) => setOffDay(e.target.value)}>
              <option value="">No weekly off day</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
            </select>
          </div>


          <button
            type="submit"
            className="admin-submit-btn"
          >
            Add Train
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

export default AddTrain;