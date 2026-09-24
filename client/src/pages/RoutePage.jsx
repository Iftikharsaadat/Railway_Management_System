import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { addStation, getAdminOverview, getAdminRoute, updateRoute } from "../services/api";

const emptyStation = { station_id: "", arrival_time: "", departure_time: "", distance_km: "", sequence_no: "" };

export default function RoutePage() {
  const { routeId } = useParams();
  const token = localStorage.getItem("token");
  const [data, setData] = useState(null);
  const [stations, setStations] = useState([]);
  const [editing, setEditing] = useState(false);
  const [newStation, setNewStation] = useState(emptyStation);
  const [stationName, setStationName] = useState("");
  const [stationCity, setStationCity] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const [route, overview] = await Promise.all([getAdminRoute(routeId, token), getAdminOverview(token)]);
      setData(route);
      setStations(overview.stations);
      setError("");
    } catch (err) { setError(err.message); }
  };

  useEffect(() => { load(); }, [routeId]);

  const updateStation = (stationId, field, value) => {
    setData((current) => ({ ...current, stations: current.stations.map((station) => station.station_id === stationId ? { ...station, [field]: value } : station) }));
  };

  const saveRoute = async (nextStations = data.stations) => {
    const sequenceNumbers = nextStations.map((station) => Number(station.sequence_no));
    if (sequenceNumbers.some((sequence) => !Number.isInteger(sequence)) || new Set(sequenceNumbers).size !== sequenceNumbers.length) {
      setError("Every station needs a unique sequence number.");
      return;
    }
    try {
      await updateRoute(routeId, nextStations.map((station) => ({
        station_id: station.station_id,
        sequence_no: Number(station.sequence_no),
        distance_km: Number(station.distance_km) || 0,
        arrival_time: station.arrival_time || null,
        departure_time: station.departure_time || null,
      })), token);
      setEditing(false); setMessage("Route updated and sorted by sequence number."); await load();
    } catch (err) { setError(err.message); }
  };

  const addExistingStation = () => {
    if (!newStation.station_id || newStation.sequence_no === "" || newStation.distance_km === "") { setError("Select a station, sequence number, and distance."); return; }
    if (data.stations.some((station) => station.station_id === Number(newStation.station_id))) { setError("That station is already on this route."); return; }
    saveRoute([...data.stations, { ...newStation, station_id: Number(newStation.station_id) }]);
    setNewStation(emptyStation);
  };

  const createAndAddStation = async () => {
    if (!stationName.trim() || !stationCity.trim() || newStation.sequence_no === "" || newStation.distance_km === "") {
      setError("Enter station name, city, sequence number, and distance.");
      return;
    }
    try {
      const result = await addStation(stationName.trim(), stationCity.trim(), token);
      const createdStation = result.station;
      await saveRoute([...data.stations, {
        station_id: createdStation.station_id,
        station_name: createdStation.station_name,
        city: createdStation.city,
        sequence_no: newStation.sequence_no,
        arrival_time: newStation.arrival_time,
        departure_time: newStation.departure_time,
        distance_km: newStation.distance_km,
      }]);
      setStationName(""); setStationCity(""); setNewStation(emptyStation);
    } catch (err) { setError(err.message); }
  };

  const removeStation = (stationId) => {
    if (data.stations.length <= 2) { setError("A route must keep at least two stations."); return; }
    if (window.confirm("Remove this station from the route?")) saveRoute(data.stations.filter((station) => station.station_id !== stationId));
  };

  if (error && !data) return <div className="admin-shell"><div className="admin-empty">{error}</div></div>;
  if (!data) return <div className="admin-shell"><div className="admin-empty">Loading route...</div></div>;

  return <div className="admin-shell"><main className="admin-content narrow">
    <Link className="back-link" to="/admin">← Back to trains</Link>
    <p className="eyebrow">ROUTE {data.route.route_id}</p>
    <h1>{data.route.from_station} <span className="route-arrow">→</span> {data.route.to_station}</h1>
    <p className="muted">Stations are ordered by sequence number. The first and last stations define From and To.</p>
    {message && <div className="admin-alert success">{message}</div>}{error && <div className="admin-alert error">{error}</div>}

    <div className="route-actions"><button className="admin-primary" onClick={() => setEditing((value) => !value)}>{editing ? "Close route editor" : "Edit route"}</button></div>

    {editing && <section className="route-editor"><div className="route-editor-heading"><div><p className="eyebrow">EDIT ROUTE</p><h2>Station order and timings</h2></div><button className="admin-primary" onClick={() => saveRoute()}>Save route</button></div>{data.stations.map((station) => <div className="route-edit-row" key={station.station_id}><strong>{station.station_name}</strong><label>Sequence<input type="number" min="1" value={station.sequence_no} onChange={(event) => updateStation(station.station_id, "sequence_no", event.target.value)} /></label><label>Arrival<input type="time" value={station.arrival_time || ""} onChange={(event) => updateStation(station.station_id, "arrival_time", event.target.value)} /></label><label>Departure<input type="time" value={station.departure_time || ""} onChange={(event) => updateStation(station.station_id, "departure_time", event.target.value)} /></label><label>Distance<input type="number" min="0" step="0.01" value={station.distance_km} onChange={(event) => updateStation(station.station_id, "distance_km", event.target.value)} /></label><button className="danger-button" onClick={() => removeStation(station.station_id)}>Remove</button></div>)}</section>}

    <section className="route-add-panel"><div><p className="eyebrow">ADD STATION</p><h2>Add existing or create new station</h2></div><div className="route-add-fields"><label>Existing station<select value={newStation.station_id} onChange={(event) => setNewStation({ ...newStation, station_id: event.target.value })}><option value="">Select station</option>{stations.filter((station) => !data.stations.some((routeStation) => routeStation.station_id === station.station_id)).map((station) => <option key={station.station_id} value={station.station_id}>{station.station_name} · {station.city}</option>)}</select></label><label>Sequence<input type="number" min="1" value={newStation.sequence_no} onChange={(event) => setNewStation({ ...newStation, sequence_no: event.target.value })} /></label><label>Arrival<input type="time" value={newStation.arrival_time} onChange={(event) => setNewStation({ ...newStation, arrival_time: event.target.value })} /></label><label>Departure<input type="time" value={newStation.departure_time} onChange={(event) => setNewStation({ ...newStation, departure_time: event.target.value })} /></label><label>Distance<input type="number" min="0" step="0.01" value={newStation.distance_km} onChange={(event) => setNewStation({ ...newStation, distance_km: event.target.value })} /></label><button className="admin-primary" onClick={addExistingStation} disabled={!newStation.station_id}>Add existing</button></div><div className="route-new-station-fields"><label>New station name<input value={stationName} onChange={(event) => setStationName(event.target.value)} placeholder="e.g. Feni Central" /></label><label>City<input value={stationCity} onChange={(event) => setStationCity(event.target.value)} placeholder="e.g. Feni" /></label><button className="admin-primary" onClick={createAndAddStation}>Create and add station</button></div></section>

    <section className="route-list">{data.stations.map((station) => <div className="route-row" key={station.station_id}><strong>{station.sequence_no}</strong><div><b>{station.station_name}</b><span>{station.city || ""} · arrival {station.arrival_time || "not set"} · departure {station.departure_time || "not set"}</span></div><small>{station.distance_km} km</small></div>)}</section>
  </main></div>;
}