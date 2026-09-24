import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addCoach } from "../services/api";

function AddCoach() {
  const navigate = useNavigate();

  const [trainId, setTrainId] = useState("");
  const [coachName, setCoachName] = useState("");
  const [seats, setSeats] = useState("");
  const [type, setType] = useState("");

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

      const data = await addCoach(
        Number(trainId),
        coachName,
        Number(seats),
        type,
        token
      );

      console.log(data);

      setMessage(
        "Coach added successfully with seats!"
      );

      setTrainId("");
      setCoachName("");
      setSeats("");
      setType("");

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-page">

      <div className="admin-page-header">

        <button
          className="back-btn"
          onClick={() => navigate("/admin")}
        >
          ← Back
        </button>

        <h1>Add Coach</h1>

        <p>
          Add a coach to an existing train.
        </p>

      </div>


      <div className="admin-form-card">

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Train ID</label>

            <input
              type="number"
              placeholder="e.g. 1"
              value={trainId}
              onChange={(e) =>
                setTrainId(e.target.value)
              }
              required
            />
          </div>


          <div className="form-group">
            <label>Coach Name</label>

            <input
              type="text"
              placeholder="e.g. C1"
              value={coachName}
              onChange={(e) =>
                setCoachName(e.target.value)
              }
              required
            />
          </div>


          <div className="form-group">
            <label>Number of Seats</label>

            <input
              type="number"
              min="1"
              placeholder="e.g. 40"
              value={seats}
              onChange={(e) =>
                setSeats(e.target.value)
              }
              required
            />
          </div>


          <div className="form-group">
            <label>Coach Type</label>

            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value)
              }
              required
            >
              <option value="">
                Select Coach Type
              </option>

              <option value="shulov">Shulov</option>
              <option value="shovan">Shovan</option>
              <option value="s_chair">S Chair</option>
              <option value="f_seat">F Seat</option>
              <option value="f_chair">F Chair</option>
              <option value="snigdha">Snigdha</option>
              <option value="f_berth">F Berth</option>
              <option value="ac_s">AC Seat</option>
              <option value="ac_berth">AC Berth</option>

            </select>
          </div>


          <button
            type="submit"
            className="admin-submit-btn"
          >
            Add Coach
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

export default AddCoach;