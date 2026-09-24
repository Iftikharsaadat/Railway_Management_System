import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteSchedule, deleteTrain, getAdminOverview, updateSchedule, updateTrain } from "../services/api";

const days = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [data, setData] = useState({ trains: [], stations: [], routes: [], schedules: [] });
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");
  const [scheduleTrain, setScheduleTrain] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [editing, setEditing] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    try { setData(await getAdminOverview(token)); setError(""); }
    catch (err) { setError(err.message); }
  };
  useEffect(() => { if (token && user?.role === "admin") load(); }, []);

  const filtered = useMemo(() => data.trains.filter((train) =>
    (!selected || String(train.train_id) === selected) &&
    train.train_name.toLowerCase().includes(query.toLowerCase())
  ), [data.trains, selected, query]);

  const filteredSchedules = useMemo(() => data.schedules.filter((schedule) =>
    (!scheduleTrain || String(schedule.train_id) === scheduleTrain) &&
    (!scheduleDate || String(schedule.date).slice(0, 10) === scheduleDate)
  ), [data.schedules, scheduleTrain, scheduleDate]);

  if (!token || user?.role !== "admin") return <div className="admin-shell"><div className="admin-empty"><h2>Admin access required</h2><button onClick={() => navigate("/login")}>Go to login</button></div></div>;

  const saveTrain = async (event) => {
    event.preventDefault();
    try { await updateTrain(editing.train_id, editing.train_name, editing.off_day, token); setEditing(null); setMessage("Train updated"); await load(); }
    catch (err) { setError(err.message); }
  };

  const removeTrain = async (train) => {
    if (!window.confirm(`Delete train "${train.train_name}"? Existing booking history may prevent this operation.`)) return;
    try { await deleteTrain(train.train_id, token); setMessage("Train deleted"); await load(); }
    catch (err) { setError(err.message); }
  };

  const saveSchedule = async (event) => {
    event.preventDefault();
    try {
      await updateSchedule(editingSchedule.schedule_id, {
        train_id: editingSchedule.train_id,
        route_id: editingSchedule.route_id,
        date: editingSchedule.date?.slice(0, 10),
        starting_time: editingSchedule.starting_time || null,
        station_id: editingSchedule.station_id,
      }, token);
      setEditingSchedule(null); setMessage("Schedule updated"); await load();
    } catch (err) { setError(err.message); }
  };

  const removeSchedule = async (schedule) => {
    if (!window.confirm(`Delete the schedule for ${schedule.train_name} on ${schedule.date}? Booking history may prevent this operation.`)) return;
    try { await deleteSchedule(schedule.schedule_id, token); setMessage("Schedule deleted"); await load(); }
    catch (err) { setError(err.message); }
  };

  return <div className="admin-shell">
    <header className="admin-topbar"><div><span className="eyebrow">OPERATIONS CONTROL</span><h1>Railway administration</h1></div><div className="admin-top-actions"><Link to="/dashboard">Passenger view</Link><button onClick={() => { localStorage.clear(); navigate("/login"); }}>Log out</button></div></header>
    <main className="admin-content">
      <div className="admin-heading"><div><p className="eyebrow">NETWORK OVERVIEW</p><h2>Train management</h2><p className="muted">Manage the network through connected records, not database IDs.</p></div><Link className="admin-primary" to="/admin/add-train">+ Add train</Link></div>
      {message && <div className="admin-alert success">{message}</div>}{error && <div className="admin-alert error">{error}</div>}
      <section className="admin-toolbar"><label>Search train<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name contains..." /></label><label>Train<select value={selected} onChange={(e) => setSelected(e.target.value)}><option value="">All trains</option>{data.trains.map((train) => <option key={train.train_id} value={train.train_id}>{train.train_name}</option>)}</select></label><div className="stat"><strong>{data.trains.length}</strong><span>trains</span></div><div className="stat"><strong>{data.stations.length}</strong><span>stations</span></div></section>
      <section className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Train</th><th>Off day</th><th>Route</th><th>From</th><th>To</th><th>Coaches</th><th>Actions</th></tr></thead><tbody>{filtered.map((train) => <tr key={train.train_id}><td><strong>{train.train_name}</strong><small>{train.schedule_count} schedules</small></td><td>{train.off_day || "No weekly break"}</td><td><Link to={`/admin/routes/${train.route_id}`}>Route {train.route_id} ↗</Link></td><td>{train.from_station}</td><td>{train.to_station}</td><td><Link to={`/admin/trains/${train.train_id}/coaches`} className="table-link">{train.coach_count} coaches ↗</Link></td><td><button className="text-button" onClick={() => setEditing({ ...train })}>Edit</button><button className="danger-button" onClick={() => removeTrain(train)}>Delete</button></td></tr>)}{filtered.length === 0 && <tr><td colSpan="7" className="empty-cell">No trains match this search.</td></tr>}</tbody></table></section>
      <section className="admin-subsection"><div className="admin-section-heading"><div><p className="eyebrow">SERVICE CALENDAR</p><h2>Schedules</h2><p className="muted">Select a train and date to view its schedules.</p></div></div><div className="admin-toolbar schedule-filters"><label>Train<select value={scheduleTrain} onChange={(event) => setScheduleTrain(event.target.value)}><option value="">All trains</option>{data.trains.map((train) => <option key={train.train_id} value={train.train_id}>{train.train_name}</option>)}</select></label><label>Date<input type="date" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} /></label><button className="text-button" onClick={() => { setScheduleTrain(""); setScheduleDate(""); }}>Clear filters</button></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Train</th><th>Date</th><th>Starting station</th><th>Departure</th><th>Action</th></tr></thead><tbody>{filteredSchedules.map((schedule) => <tr key={schedule.schedule_id}><td><strong>{schedule.train_name}</strong><small>Route {schedule.route_id}</small></td><td>{schedule.date}</td><td>{schedule.station_name}</td><td>{schedule.starting_time || "Not set"}</td><td><button className="text-button" onClick={() => setEditingSchedule({ ...schedule })}>Edit schedule</button><button className="danger-button" onClick={() => removeSchedule(schedule)}>Delete schedule</button></td></tr>)}{filteredSchedules.length === 0 && <tr><td colSpan="5" className="empty-cell">No schedules match the selected train and date.</td></tr>}</tbody></table></div></section>
      {editing && <div className="admin-modal-backdrop"><form className="admin-modal" onSubmit={saveTrain}><button type="button" className="modal-close" onClick={() => setEditing(null)}>×</button><p className="eyebrow">EDIT TRAIN</p><h3>{editing.train_name}</h3><label>Train name<input value={editing.train_name} onChange={(e) => setEditing({ ...editing, train_name: e.target.value })} required /></label><label>Weekly off day<select value={editing.off_day || ""} onChange={(e) => setEditing({ ...editing, off_day: e.target.value })}>{days.map((day) => <option key={day} value={day}>{day || "No weekly break"}</option>)}</select></label><button className="admin-primary" type="submit">Save changes</button></form></div>}
      {editingSchedule && <div className="admin-modal-backdrop"><form className="admin-modal" onSubmit={saveSchedule}><button type="button" className="modal-close" onClick={() => setEditingSchedule(null)}>×</button><p className="eyebrow">EDIT SCHEDULE</p><h3>{editingSchedule.train_name}</h3><label>Journey date<input type="date" value={editingSchedule.date?.slice(0, 10) || ""} onChange={(event) => setEditingSchedule({ ...editingSchedule, date: event.target.value })} required /></label><label>Starting time<input type="time" value={editingSchedule.starting_time || ""} onChange={(event) => setEditingSchedule({ ...editingSchedule, starting_time: event.target.value })} /></label><label>Starting station<select value={editingSchedule.station_id} onChange={(event) => setEditingSchedule({ ...editingSchedule, station_id: Number(event.target.value) })} required>{data.routeStations.filter((station) => station.route_id === editingSchedule.route_id).map((station) => <option key={station.station_id} value={station.station_id}>{station.station_name} · {station.city}</option>)}</select></label><button className="admin-primary" type="submit">Save schedule</button></form></div>}
    </main>
  </div>;
}

export default AdminDashboard;