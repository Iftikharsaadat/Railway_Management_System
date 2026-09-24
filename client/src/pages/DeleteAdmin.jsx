
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteTrain,
  deleteCoach,
  deleteRoute,
  deleteSchedule,
  deleteStation,
} from "../services/api";

function DeleteAdmin() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const [ids, setIds] = useState({
    train: "",
    coach: "",
    route: "",
    schedule: "",
    station: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");

  // Extra protection: only admins can use this page.
  if (!token || user?.role !== "admin") {
    return (
      <div className="dashboard-page">
        <div className="dashboard-message">
          <h2>Admin access required.</h2>

          <button onClick={() => navigate("/admin")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const updateId = (key, value) => {
    setIds((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const runDelete = async (type, deleteFunction, label) => {
    const id = Number(ids[type]);

    if (!Number.isInteger(id) || id <= 0) {
      setError(`Enter a valid ${type}_id.`);
      setMessage("");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${label} #${id}?\n\n` +
        "This operation may remove related database records."
    );

    if (!confirmed) {
      return;
    }

    setLoading(type);
    setError("");
    setMessage("");

    try {
      const result = await deleteFunction(id, token);

      setMessage(result.message);

      setIds((prev) => ({
        ...prev,
        [type]: "",
      }));
    } catch (err) {
      setError(err.message || "Delete operation failed.");
    } finally {
      setLoading("");
    }
  };

  const items = [
    {
      type: "train",
      title: "Delete Train",
      description:
        "Deletes the train, its coaches/seats, schedules, and related ticket/payment records.",
      fn: deleteTrain,
    },
    {
      type: "coach",
      title: "Delete Coach",
      description:
        "Deletes a coach and its seats. A coach with ticket-seat records cannot be deleted.",
      fn: deleteCoach,
    },
    {
      type: "route",
      title: "Delete Route",
      description:
        "Deletes a route and its route-station records. A route used by a train cannot be deleted.",
      fn: deleteRoute,
    },
    {
      type: "schedule",
      title: "Delete Schedule",
      description:
        "Deletes a schedule together with its related tickets and payment records.",
      fn: deleteSchedule,
    },
    {
      type: "station",
      title: "Delete Station",
      description:
        "Deletes only an unused station. Stations referenced by other records are protected.",
      fn: deleteStation,
    },
  ];

  return (
    <div className="dashboard-page">
      <nav className="dashboard-navbar">
        <div className="dashboard-logo">
          🚆 Railway<span>Booking</span>
        </div>

        <button
          className="logout-button"
          onClick={() => navigate("/admin")}
        >
          Back to Dashboard
        </button>
      </nav>

      <main className="dashboard-content">
        <section className="welcome-section">
          <div>
            <p className="dashboard-small-title">ADMINISTRATION</p>

            <h1>Delete Operations</h1>

            <p>
              Enter the database ID of the item you want to delete.
            </p>
          </div>
        </section>

        {message && (
          <div className="dashboard-success">
            {message}
          </div>
        )}

        {error && (
          <div className="dashboard-error">
            {error}
          </div>
        )}

        <section className="admin-section">
          <div className="admin-grid">
            {items.map((item) => (
              <div className="admin-card" key={item.type}>
                <div className="admin-card-icon">🗑️</div>

                <h3>{item.title}</h3>

                <p>{item.description}</p>

                <input
                  type="number"
                  min="1"
                  placeholder={`${item.type}_id`}
                  value={ids[item.type]}
                  onChange={(e) =>
                    updateId(item.type, e.target.value)
                  }
                />

                <button
                  className="search-button"
                  disabled={loading === item.type}
                  onClick={() =>
                    runDelete(
                      item.type,
                      item.fn,
                      item.type
                    )
                  }
                >
                  {loading === item.type
                    ? "Deleting..."
                    : item.title}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default DeleteAdmin;

