import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  addCoach,
  addSchedule,
  addStation,
  addStationToRouteAdmin,
  addTrain,
  deleteCoach,
  deleteSchedule,
  deleteStation,
  deleteStationFromRoute,
  deleteTrain,
  getAdminStations,
  getAdminTrains,
  getRoute,
  getAdminSchedules,
  getSchedule,
  getTrainCoaches,
  updateSchedule,
  updateStation,
  updateCoach,
  updateRouteStation,
  updateTrain,
} from "../services/api";

const token = () => localStorage.getItem("token");
const display = (value) => value ?? "";

function AdminManagement() {
  const params = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [tab, setTab] = useState("trains");

  if (!user || user.role !== "admin") {
    return <div className="dashboard-message"><h2>Admin access required.</h2><button onClick={() => navigate("/dashboard")}>Back to Dashboard</button></div>;
  }

  if (params.routeId) return <RouteDetails routeId={params.routeId} />;
  if (params.trainId) return <CoachDetails trainId={params.trainId} />;

  return (
    <ManagementShell tab={tab} setTab={setTab}>
      {tab === "trains" && <TrainTable />}
      {tab === "schedule" && <ScheduleTable />}
      {tab === "stations" && <StationTable />}
    </ManagementShell>
  );
}

function ManagementShell({ tab, setTab, children }) {
  const navigate = useNavigate();
  return <div className="dashboard-page"><nav className="dashboard-navbar"><div className="dashboard-logo">Railway<span>Admin</span></div><button className="logout-button" onClick={() => navigate("/dashboard")}>Back</button></nav><main className="management-page"><div className="management-header"><div><p className="dashboard-small-title">ADMINISTRATION</p><h1>Operations center</h1><p>Manage trains, schedules, and stations from one place.</p></div></div><div className="management-tabs"><button className={tab === "trains" ? "active" : ""} onClick={() => setTab("trains")}>Modify trains</button><button className={tab === "schedule" ? "active" : ""} onClick={() => setTab("schedule")}>Modify schedule</button><button className={tab === "stations" ? "active" : ""} onClick={() => setTab("stations")}>Modify stations</button></div>{children}</main></div>;
}

function DataToolbar({ title, search, setSearch, action, actionLabel }) {
  return <div className="data-toolbar"><div><h2>{title}</h2><p>Search and edit records inline.</p></div><div className="toolbar-actions"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." /><button className="primary-button" onClick={action}>{actionLabel}</button></div></div>;
}

function TrainTable() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]); const [search, setSearch] = useState(""); const [error, setError] = useState(""); const [editing, setEditing] = useState(null); const [form, setForm] = useState({ train_name: "", route_id: "", off_day: "" });
  const load = async () => { try { setRows((await getAdminTrains(search, token())).trains || []); } catch (err) { setError(err.message); } };
  useEffect(() => { load(); }, [search]);
  const save = async (row) => { try { await updateTrain(row.train_id, { train_name: row.train_name, off_day: row.off_day || null }, token()); setEditing(null); load(); } catch (err) { setError(err.message); } };
  const create = async () => { try { await addTrain(form.train_name, Number(form.route_id), form.off_day, token()); setForm({ train_name: "", route_id: "", off_day: "" }); load(); } catch (err) { setError(err.message); } };
  return <section className="management-section"><DataToolbar title="Trains" search={search} setSearch={setSearch} action={create} actionLabel="+ Add train" /><div className="inline-add-form"><input placeholder="Train name" value={form.train_name} onChange={(e) => setForm({ ...form, train_name: e.target.value })} /><input placeholder="Route ID" value={form.route_id} onChange={(e) => setForm({ ...form, route_id: e.target.value })} /><input placeholder="Off day (optional)" value={form.off_day} onChange={(e) => setForm({ ...form, off_day: e.target.value })} /></div>{error && <div className="dashboard-error">{error}</div>}<div className="table-wrap"><table className="management-table"><thead><tr><th>ID</th><th>Name</th><th>Off day</th><th>Route</th><th>From</th><th>To</th><th>Coaches</th><th>Actions</th></tr></thead><tbody>{rows.map((row) => { const edit = editing === row.train_id; return <tr key={row.train_id}><td>{row.train_id}</td><td>{edit ? <input value={row.train_name} onChange={(e) => setRows(rows.map((item) => item.train_id === row.train_id ? { ...item, train_name: e.target.value } : item))} /> : row.train_name}</td><td>{edit ? <input value={display(row.off_day)} onChange={(e) => setRows(rows.map((item) => item.train_id === row.train_id ? { ...item, off_day: e.target.value } : item))} /> : display(row.off_day) || "None"}</td><td><button className="table-link" onClick={() => navigate(`/admin/manage/route/${row.route_id}`)}>Route #{row.route_id}</button></td><td>{row.from_station}</td><td>{row.to_station}</td><td><button className="table-link" onClick={() => navigate(`/admin/manage/train/${row.train_id}/coaches`)}>{row.no_of_coaches}</button></td><td className="row-actions">{edit ? <button onClick={() => save(row)}>Save</button> : <button onClick={() => setEditing(row.train_id)}>Edit</button>}<button className="danger-button" onClick={async () => { if (window.confirm(`Delete ${row.train_name}?`)) { await deleteTrain(row.train_id, token()); load(); } }}>Delete</button></td></tr>; })}</tbody></table></div></section>;
}

function ScheduleTable() {
  const [rows, setRows] = useState([]); const [search, setSearch] = useState(""); const [form, setForm] = useState({ train_id: "", route_id: "", date: "", starting_time: "", station_id: "" }); const [editing, setEditing] = useState(null); const [error, setError] = useState("");
  const load = async () => { try { setRows((await getAdminSchedules(search, token())).schedules || []); } catch (err) { setError(err.message); } };
  useEffect(() => { load(); }, [search]);
  const save = async (row) => { try { await updateSchedule(row.schedule_id, { train_id: row.train_id, route_id: row.route_id, date: row.date, starting_time: row.starting_time || null, station_id: row.station_id }, token()); setEditing(null); load(); } catch (err) { setError(err.message); } };
  const create = async () => { try { await addSchedule({ ...form, train_id: Number(form.train_id), route_id: Number(form.route_id), station_id: Number(form.station_id) }, token()); setForm({ train_id: "", route_id: "", date: "", starting_time: "", station_id: "" }); load(); } catch (err) { setError(err.message); } };
  return <section className="management-section"><DataToolbar title="Schedules" search={search} setSearch={setSearch} action={create} actionLabel="+ Add schedule" /><div className="inline-add-form"><input placeholder="Train ID" value={form.train_id} onChange={(e) => setForm({ ...form, train_id: e.target.value })} /><input placeholder="Route ID" value={form.route_id} onChange={(e) => setForm({ ...form, route_id: e.target.value })} /><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /><input type="time" value={form.starting_time} onChange={(e) => setForm({ ...form, starting_time: e.target.value })} /><input placeholder="Starting station ID" value={form.station_id} onChange={(e) => setForm({ ...form, station_id: e.target.value })} /></div>{error && <div className="dashboard-error">{error}</div>}<div className="table-wrap"><table className="management-table"><thead><tr><th>ID</th><th>Train</th><th>Route</th><th>Date</th><th>Starting time</th><th>Station</th><th>Actions</th></tr></thead><tbody>{rows.map((row) => { const edit = editing === row.schedule_id; return <tr key={row.schedule_id}><td>{row.schedule_id}</td><td>{edit ? <input value={row.train_id} onChange={(e) => setRows(rows.map((x) => x.schedule_id === row.schedule_id ? { ...x, train_id: e.target.value } : x))} /> : row.train_name || row.train_id}</td><td>{row.route_id}</td><td>{edit ? <input type="date" value={row.date?.slice(0, 10)} onChange={(e) => setRows(rows.map((x) => x.schedule_id === row.schedule_id ? { ...x, date: e.target.value } : x))} /> : String(row.date).slice(0, 10)}</td><td>{edit ? <input type="time" value={row.starting_time || ""} onChange={(e) => setRows(rows.map((x) => x.schedule_id === row.schedule_id ? { ...x, starting_time: e.target.value } : x))} /> : display(row.starting_time)}</td><td>{row.station_name || row.station_id}</td><td className="row-actions">{edit ? <button onClick={() => save(row)}>Save</button> : <button onClick={() => setEditing(row.schedule_id)}>Edit</button>}<button className="danger-button" onClick={async () => { if (window.confirm("Delete this schedule?")) { await deleteSchedule(row.schedule_id, token()); load(); } }}>Delete</button></td></tr>; })}</tbody></table></div></section>;
}

function StationTable() {
  const [rows, setRows] = useState([]); const [search, setSearch] = useState(""); const [editing, setEditing] = useState(null); const [error, setError] = useState(""); const [form, setForm] = useState({ station_name: "", city: "" });
  const load = async () => { try { setRows((await getAdminStations(search, token())).stations || []); } catch (err) { setError(err.message); } }; useEffect(() => { load(); }, [search]);
  const save = async (row) => { try { await updateStation(row.station_id, { station_name: row.station_name, city: row.city }, token()); setEditing(null); load(); } catch (err) { setError(err.message); } };
  const create = async () => { try { await addStation(form.station_name, form.city, token()); setForm({ station_name: "", city: "" }); load(); } catch (err) { setError(err.message); } };
  return <section className="management-section"><DataToolbar title="Stations" search={search} setSearch={setSearch} action={create} actionLabel="+ Add station" /><div className="inline-add-form"><input placeholder="Station name" value={form.station_name} onChange={(e) => setForm({ ...form, station_name: e.target.value })} /><input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>{error && <div className="dashboard-error">{error}</div>}<div className="table-wrap"><table className="management-table"><thead><tr><th>ID</th><th>Name</th><th>City</th><th>Actions</th></tr></thead><tbody>{rows.map((row) => { const edit = editing === row.station_id; return <tr key={row.station_id}><td>{row.station_id}</td><td>{edit ? <input value={row.station_name} onChange={(e) => setRows(rows.map((x) => x.station_id === row.station_id ? { ...x, station_name: e.target.value } : x))} /> : row.station_name}</td><td>{edit ? <input value={display(row.city)} onChange={(e) => setRows(rows.map((x) => x.station_id === row.station_id ? { ...x, city: e.target.value } : x))} /> : display(row.city)}</td><td className="row-actions">{edit ? <button onClick={() => save(row)}>Save</button> : <button onClick={() => setEditing(row.station_id)}>Edit</button>}<button className="danger-button" onClick={async () => { if (window.confirm("Delete this station?")) { await deleteStation(row.station_id, token()); load(); } }}>Delete</button></td></tr>; })}</tbody></table></div></section>;
}

function RouteDetails({ routeId }) {
  const navigate = useNavigate(); const [data, setData] = useState(null); const [error, setError] = useState(""); const [newRow, setNewRow] = useState({ station_id: "", sequence_no: "", arrival_time: "", departure_time: "", distance_km: "" });
  const load = async () => { try { setData(await getRoute(routeId, token())); } catch (err) { setError(err.message); } }; useEffect(() => { load(); }, [routeId]);
  const update = async (row) => { try { await updateRouteStation(routeId, row.station_id, { arrival_time: row.arrival_time || null, departure_time: row.departure_time || null, distance_km: Number(row.distance_km) }, token()); load(); } catch (err) { setError(err.message); } };
  const add = async () => { try { await addStationToRouteAdmin({ route_id: Number(routeId), station_id: Number(newRow.station_id), sequence_no: Number(newRow.sequence_no), arrival_time: newRow.arrival_time || null, departure_time: newRow.departure_time || null, distance_km: Number(newRow.distance_km) }, token()); setNewRow({ station_id: "", sequence_no: "", arrival_time: "", departure_time: "", distance_km: "" }); load(); } catch (err) { setError(err.message); } };
  if (!data) return <div className="management-page"><button onClick={() => navigate("/admin/manage")}>Back</button><p>{error || "Loading..."}</p></div>;
  return <div className="dashboard-page"><nav className="dashboard-navbar"><div className="dashboard-logo">Route #{routeId}</div><button className="logout-button" onClick={() => navigate("/admin/manage")}>Back</button></nav><main className="management-page"><section className="management-section"><div className="data-toolbar"><div><h2>{data.route.start_station_name} to {data.route.end_station_name}</h2><p>Edit times and distance, or add/remove stops.</p></div></div><div className="inline-add-form"><input placeholder="Station ID" value={newRow.station_id} onChange={(e) => setNewRow({ ...newRow, station_id: e.target.value })} /><input placeholder="Sequence" value={newRow.sequence_no} onChange={(e) => setNewRow({ ...newRow, sequence_no: e.target.value })} /><input type="time" value={newRow.arrival_time} onChange={(e) => setNewRow({ ...newRow, arrival_time: e.target.value })} /><input type="time" value={newRow.departure_time} onChange={(e) => setNewRow({ ...newRow, departure_time: e.target.value })} /><input placeholder="Distance km" value={newRow.distance_km} onChange={(e) => setNewRow({ ...newRow, distance_km: e.target.value })} /><button onClick={add}>Add stop</button></div>{error && <div className="dashboard-error">{error}</div>}<div className="table-wrap"><table className="management-table"><thead><tr><th>Seq</th><th>Station</th><th>City</th><th>Arrival</th><th>Departure</th><th>Distance</th><th>Actions</th></tr></thead><tbody>{data.routeStations.map((row) => <RouteRow key={row.station_id} row={row} routeId={routeId} onSave={update} onDelete={async () => { if (window.confirm("Remove this stop?")) { await deleteStationFromRoute(routeId, row.station_id, token()); load(); } }} />)}</tbody></table></div></section></main></div>;
}

function RouteRow({ row, routeId, onSave, onDelete }) { const [edit, setEdit] = useState(false); const [value, setValue] = useState(row); return <tr><td>{row.sequence_no}</td><td>{row.station_name}</td><td>{row.city}</td><td>{edit ? <input type="time" value={value.arrival_time || ""} onChange={(e) => setValue({ ...value, arrival_time: e.target.value })} /> : display(row.arrival_time)}</td><td>{edit ? <input type="time" value={value.departure_time || ""} onChange={(e) => setValue({ ...value, departure_time: e.target.value })} /> : display(row.departure_time)}</td><td>{edit ? <input value={value.distance_km} onChange={(e) => setValue({ ...value, distance_km: e.target.value })} /> : row.distance_km}</td><td className="row-actions">{edit ? <button onClick={() => { onSave(value); setEdit(false); }}>Save</button> : <button onClick={() => setEdit(true)}>Edit</button>}<button className="danger-button" onClick={onDelete}>Delete</button></td></tr>; }

function CoachDetails({ trainId }) {
  const navigate = useNavigate(); const [data, setData] = useState(null); const [selected, setSelected] = useState(null); const [error, setError] = useState(""); const [form, setForm] = useState({ coach_name: "", seats: "", type: "" });
  const load = async () => { try { const response = await fetch(`http://localhost:5000/api/trains/admin/trains/${trainId}/coaches`, { headers: { Authorization: `Bearer ${token()}` } }); const result = await response.json(); if (!response.ok) throw new Error(result.error); setData(result); } catch (err) { setError(err.message); } }; useEffect(() => { load(); }, [trainId]);
  const create = async () => { try { await addCoach(Number(trainId), form.coach_name, Number(form.seats), form.type, token()); setForm({ coach_name: "", seats: "", type: "" }); load(); } catch (err) { setError(err.message); } };
  const editName = async (coach) => { const coachName = window.prompt("Coach name", coach.coach_name); if (coachName == null) return; try { await updateCoach(coach.coach_id, { coach_name: coachName }, token()); load(); } catch (err) { setError(err.message); } };
  return <div className="dashboard-page"><nav className="dashboard-navbar"><div className="dashboard-logo">{data?.train?.train_name || "Train"} coaches</div><button className="logout-button" onClick={() => navigate("/admin/manage")}>Back</button></nav><main className="management-page"><section className="management-section"><div className="data-toolbar"><div><h2>Coaches</h2><p>Open a coach to inspect its seats.</p></div><button className="primary-button" onClick={create}>+ Add coach</button></div><div className="inline-add-form"><input placeholder="Coach name" value={form.coach_name} onChange={(e) => setForm({ ...form, coach_name: e.target.value })} /><input type="number" placeholder="Seats" value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value })} /><input placeholder="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></div>{error && <div className="dashboard-error">{error}</div>}<div className="coach-grid">{data?.coaches?.map((coach) => <article className="coach-box" key={coach.coach_id} onClick={() => setSelected(selected === coach.coach_id ? null : coach.coach_id)}><h3>{coach.coach_name}</h3><p>{coach.type} · {coach.seats} seats</p><div className="row-actions"><button onClick={(e) => { e.stopPropagation(); editName(coach); }}>Edit name</button><button className="danger-button" onClick={async (e) => { e.stopPropagation(); if (window.confirm("Delete this coach?")) { await deleteCoach(coach.coach_id, token()); load(); } }}>Delete</button></div>{selected === coach.coach_id && <div className="seat-list">{coach.seat_details.map((seat) => <span key={seat.seat_id} className={`seat-chip ${seat.reservation_status}`}>{seat.seat_number}</span>)}</div>}</article>)}</div></section></main></div>;
}

export default AdminManagement;
