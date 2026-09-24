import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addTrainWithRoute, getAdminOverview } from "../services/api";

const blankStation = () => ({ station_id: "", arrival_time: "", departure_time: "", distance_km: "" });
const days = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function AddTrain() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [availableStations, setAvailableStations] = useState([]);
  const [trainName, setTrainName] = useState("");
  const [offDay, setOffDay] = useState("");
  const [stations, setStations] = useState([blankStation(), blankStation()]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminOverview(token).then((data) => setAvailableStations(data.stations)).catch((err) => setError(err.message));
  }, [token]);

  const updateStation = (index, field, value) => setStations((current) => current.map((station, stationIndex) => stationIndex === index ? { ...station, [field]: value } : station));
  const addStationRow = () => setStations((current) => [...current, blankStation()]);
  const removeStationRow = (index) => { if (stations.length > 2) setStations((current) => current.filter((_, stationIndex) => stationIndex !== index)); };

  const submit = async (event) => {
    event.preventDefault(); setError(""); setMessage("");
    if (new Set(stations.map((station) => station.station_id)).size !== stations.length || stations.some((station) => !station.station_id || station.distance_km === "")) {
      setError("Choose a different station for each stop and enter a distance for every stop."); return;
    }
    try {
      const orderedStations = stations.map((station, index) => ({ station_id: Number(station.station_id), sequence_no: index + 1, arrival_time: station.arrival_time || null, departure_time: station.departure_time || null, distance_km: Number(station.distance_km) }));
      await addTrainWithRoute(trainName, offDay, orderedStations, token);
      setMessage("Route and train created successfully."); setTrainName(""); setOffDay(""); setStations([blankStation(), blankStation()]);
    } catch (err) { setError(err.message); }
  };

  return <div className="admin-page"><div className="admin-page-header"><button className="back-btn" onClick={() => navigate("/admin")}>← Back to operations</button><h1>Create route and train</h1><p>Build the ordered route first, then attach the new train without entering database IDs.</p></div><div className="admin-form-card"><form onSubmit={submit}><div className="form-row"><div className="form-group"><label>Train name</label><input value={trainName} onChange={(event) => setTrainName(event.target.value)} placeholder="e.g. Subarna Express" required /></div><div className="form-group"><label>Weekly off day</label><select value={offDay} onChange={(event) => setOffDay(event.target.value)}>{days.map((day) => <option key={day} value={day}>{day || "No weekly break"}</option>)}</select></div></div><h3 className="section-title">Ordered route stations</h3><p className="form-help">The first station becomes From and the last station becomes To.</p>{stations.map((station, index) => <div className="route-station-box" key={index}><div className="route-station-title">Stop {index + 1}</div><div className="form-group"><label>Station</label><select value={station.station_id} onChange={(event) => updateStation(index, "station_id", event.target.value)} required><option value="">Select station</option>{availableStations.map((availableStation) => <option key={availableStation.station_id} value={availableStation.station_id}>{availableStation.station_name} · {availableStation.city}</option>)}</select></div><div className="form-row"><div className="form-group"><label>Arrival time</label><input type="time" value={station.arrival_time} onChange={(event) => updateStation(index, "arrival_time", event.target.value)} /></div><div className="form-group"><label>Departure time</label><input type="time" value={station.departure_time} onChange={(event) => updateStation(index, "departure_time", event.target.value)} /></div></div><div className="form-group"><label>Distance from route origin (km)</label><input type="number" min="0" step="0.01" value={station.distance_km} onChange={(event) => updateStation(index, "distance_km", event.target.value)} required /></div>{stations.length > 2 && <button type="button" className="remove-btn" onClick={() => removeStationRow(index)}>Remove stop</button>}</div>)}<button type="button" className="secondary-btn" onClick={addStationRow}>+ Add another stop</button><button type="submit" className="admin-submit-btn">Create route and train</button></form>{message && <div className="success-message">{message}</div>}{error && <div className="error-message">{error}</div>}</div></div>;
}

export default AddTrain;