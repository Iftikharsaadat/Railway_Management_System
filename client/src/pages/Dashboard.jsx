// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { getTrainDetails, searchTrains } from "../services/api";

// function Dashboard() {
//   const navigate = useNavigate();

//   const user = JSON.parse(localStorage.getItem("user"));
//   const token = localStorage.getItem("token");

//   const [from, setFrom] = useState("");
//   const [to, setTo] = useState("");
//   const [date, setDate] = useState("");

//   const [trains, setTrains] = useState([]);
//   const [selectedTrain, setSelectedTrain] = useState(null);
//   const [details, setDetails] = useState(null);
//   const [detailsLoading, setDetailsLoading] = useState(false);
//   const [detailsError, setDetailsError] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const isAdmin = user?.role === "admin";

//   const handleSearch = async (e) => {
//     e.preventDefault();

//     setError("");
//     setTrains([]);

//     if (!from || !to || !date) {
//       setError("Please enter From, To and Journey Date.");
//       return;
//     }

//     setLoading(true);

//     try {
//       const data = await searchTrains(from, to, date, token);

//     setTrains(data.availableTrains || []);

//     } catch (error) {
//       setError(error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");

//     navigate("/login");
//   };

//   const handleDetails = async (train) => {
//     setSelectedTrain(train);
//     setDetails(null);
//     setDetailsError("");
//     setDetailsLoading(true);

//     try {
//       const data = await getTrainDetails(
//         train.train_id,
//         from,
//         to,
//         date,
//         token
//       );
//       setDetails(data);
//     } catch (error) {
//       setDetailsError(error.message);
//     } finally {
//       setDetailsLoading(false);
//     }
//   };

//   if (!user || !token) {
//     return (
//       <div className="dashboard-page">
//         <div className="dashboard-message">
//           <h2>You are not logged in.</h2>
//           <button onClick={() => navigate("/login")}>
//             Go to Login
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="dashboard-page">

//       {/* NAVBAR */}
//       <nav className="dashboard-navbar">

//         <div className="dashboard-logo">
//           🚆 Railway<span>Booking</span>
//         </div>

//         <div className="dashboard-user">

//           <div className="user-info">
//             <strong>{user.name}</strong>
//             <span>
//               {isAdmin ? "Administrator" : "Passenger"}
//             </span>
//           </div>

//           <button
//             className="logout-button"
//             onClick={handleLogout}
//           >
//             Logout
//           </button>

//         </div>

//       </nav>


//       {/* MAIN CONTENT */}
//       <main className="dashboard-content">

//         {/* WELCOME */}
//         <section className="welcome-section">

//           <div>
//             <p className="dashboard-small-title">
//               RAILWAY BOOKING SYSTEM
//             </p>

//             <h1>
//               Welcome, {user.name} 👋
//             </h1>

//             <p>
//               Search for your train and plan your journey.
//             </p>
//           </div>

//         </section>


//         {/* SEARCH BOX */}
//         <section className="search-section">

//           <div className="section-heading">
//             <h2>Search Trains</h2>
//             <p>Find available trains for your journey.</p>
//           </div>


//           <form
//             className="train-search-form"
//             onSubmit={handleSearch}
//           >

//             <div className="search-field">

//               <label>From</label>

//               <input
//                 type="text"
//                 placeholder="Departure station"
//                 value={from}
//                 onChange={(e) => setFrom(e.target.value)}
//               />

//             </div>


//             <div className="search-field">

//               <label>To</label>

//               <input
//                 type="text"
//                 placeholder="Destination station"
//                 value={to}
//                 onChange={(e) => setTo(e.target.value)}
//               />

//             </div>


//             <div className="search-field">

//               <label>Journey Date</label>

//               <input
//                 type="date"
//                 value={date}
//                 onChange={(e) => setDate(e.target.value)}
//               />

//             </div>


//             <button
//               type="submit"
//               className="search-button"
//               disabled={loading}
//             >
//               {loading ? "Searching..." : "🔍 Search Train"}
//             </button>

//           </form>


//           {error && (
//             <div className="dashboard-error">
//               {error}
//             </div>
//           )}

//         </section>


//         {/* SEARCH RESULTS */}
//         {trains.length > 0 && (
//   <section className="results-section">

//     <div className="section-heading">
//       <h2>Available Trains</h2>
//       <p>
//         {trains.length} train(s) found.
//       </p>
//     </div>

//     <div className="train-results">

//       {trains.map((train, index) => (

//         <div
//           className="train-card"
//           key={`${train.train_name}-${index}`}
//         >

//           <div className="train-card-header">

//             <div>
//               <span className="train-label">
//                 TRAIN
//               </span>

//               <h3>
//                 {train.train_name}
//               </h3>
//             </div>

//             <span className="train-number">
//               Route #{train.route_id}
//             </span>

//           </div>


//           <div className="train-route">

//             <div>
//               <span>From</span>

//               <strong>
//                 {from}
//               </strong>

//               <small>
//                 Departure:{" "}
//                 {train.departure_from_source || "N/A"}
//               </small>
//             </div>


//             <div className="route-arrow">
//               →
//             </div>


//             <div>
//               <span>To</span>

//               <strong>
//                 {to}
//               </strong>

//               <small>
//                 Arrival:{" "}
//                 {train.arrival_at_destination || "N/A"}
//               </small>
//             </div>

//           </div>


//           <div className="train-card-footer">

//             <span>
//               📅 {date}
//             </span>

//             <button
//               className="details-button"
//               onClick={() => handleDetails(train)}
//             >
//               View Details
//             </button>

//           </div>

//         </div>

//       ))}

//     </div>

//   </section>
// )}

//         {selectedTrain && (
//           <section className="train-details-section">
//             <div className="section-heading">
//               <h2>{selectedTrain.train_name} details</h2>
//               <button className="details-button" onClick={() => setSelectedTrain(null)}>
//                 Close
//               </button>
//             </div>

//             {detailsLoading && <p>Loading train details...</p>}
//             {detailsError && <div className="dashboard-error">{detailsError}</div>}

//             {details && (
//               <>
//                 <h3>Route</h3>
//                 <p>
//                   {details.route.map((station) => station.station_name).join(" → ")}
//                 </p>

//                 <h3>Coach availability and fares</h3>
//                 <div className="train-results">
//                   {details.types.map((type) => (
//                     <div className="train-card" key={type.coach_type}>
//                       <h3>{type.coach_type}</h3>
//                       <p>Fare: {type.price ?? "N/A"}</p>
//                       <p>Available: {type.available_count}</p>
//                       <p>Booked: {type.booked_count}</p>
//                       <p>Pending: {type.pending_count}</p>
//                     </div>
//                   ))}
//                 </div>
//               </>
//             )}
//           </section>
//         )}


//         {/* ADMIN PANEL */}
//         {isAdmin && (

//           <section className="admin-section">

//             <div className="section-heading">

//               <div>
//                 <p className="admin-label">
//                   ADMINISTRATION
//                 </p>

//                 <h2>Admin Controls</h2>

//                 <p>
//                   Manage trains, stations and coaches.
//                 </p>
//               </div>

//             </div>


//             <div className="admin-section">

//   <h2>Admin Panel</h2>

//   <div className="admin-grid">

//     <a
//       href="/admin/manage"
//       className="admin-card"
//     >
//       <div className="admin-card-icon">
//         🛠️
//       </div>
//
//       <h3>Management Center</h3>
//
//       <p>
//         Modify trains, schedules and stations.
//       </p>
//     </a>
//
//     <a
//       href="/admin/add-train"
//       className="admin-card"
//     >
//       <div className="admin-card-icon">
//         🚆
//       </div>

//       <h3>Add Train</h3>

//       <p>
//         Add a new train to a route.
//       </p>
//     </a>


//     <a
//       href="/admin/add-station"
//       className="admin-card"
//     >
//       <div className="admin-card-icon">
//         🚉
//       </div>

//       <h3>Add Station</h3>

//       <p>
//         Create a new railway station.
//       </p>
//     </a>


//     <a
//       href="/admin/add-route"
//       className="admin-card"
//     >
//       <div className="admin-card-icon">
//         🛤️
//       </div>

//       <h3>Add Route</h3>

//       <p>
//         Create a railway route.
//       </p>
//     </a>


//     <a
//       href="/admin/add-station-to-route"
//       className="admin-card"
//     >
//       <div className="admin-card-icon">
//         📍
//       </div>

//       <h3>Add Station To Route</h3>

//       <p>
//         Add a station to an existing route.
//       </p>
//     </a>


//     <a
//       href="/admin/add-coach"
//       className="admin-card"
//     >
//       <div className="admin-card-icon">
//         🚃
//       </div>

//       <h3>Add Coach</h3>

//       <p>
//         Add coach and generate seats.
//       </p>
//     </a>


//     {/* আপাতত Delete কাজ করবে না */}

//     <div
//       className="admin-card disabled-admin-card"
//     >
//       <div className="admin-card-icon">
//         🗑️
//       </div>

//       <h3>Delete Train</h3>

//       <p>
//         Delete feature requires server endpoint.
//       </p>
//     </div>


//     <div
//       className="admin-card disabled-admin-card"
//     >
//       <div className="admin-card-icon">
//         🗑️
//       </div>

//       <h3>Delete Station</h3>

//       <p>
//         Delete feature requires server endpoint.
//       </p>
//     </div>

//   </div>

// </div>

//           </section>

//         )}

//       </main>

//     </div>
//   );
// }

// export default Dashboard;




















import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getStations, getTrainDetails, searchTrains } from "../services/api";
import SeatBookingPanel from "../components/SeatBookingPanel";

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const restoreBooking = location.state?.restoreBooking;

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [from, setFrom] = useState(restoreBooking?.journey.from_name || "");
  const [to, setTo] = useState(restoreBooking?.journey.to_name || "");
  const [date, setDate] = useState(restoreBooking?.journey.date || "");
  const [stations, setStations] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [trains, setTrains] = useState(restoreBooking?.train ? [restoreBooking.train] : []);
  const [selectedTrain, setSelectedTrain] = useState(restoreBooking?.train || null);
  const [details, setDetails] = useState(restoreBooking?.route ? { route: restoreBooking.route } : null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === "admin";
  const journey = useMemo(() => selectedTrain ? ({
    schedule_id: selectedTrain.schedule_id,
    train_id: selectedTrain.train_id,
    date,
    from_station_id: selectedTrain.from_station_id,
    to_station_id: selectedTrain.to_station_id,
    from_name: from,
    to_name: to,
  }) : null, [selectedTrain, date, from, to]);

  useEffect(() => {
    let active = true;
    getStations(token)
      .then((data) => { if (active) setStations(data.stations || []); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();

    setError("");
    setTrains([]);
    setSelectedTrain(null);
    setDetails(null);
    setHasSearched(false);

    if (!from || !to || !date) {
      setError("Please enter From, To and Journey Date.");
      return;
    }

    setLoading(true);

    try {
      const data = await searchTrains(from, to, date, token);

      setTrains(data.availableTrains || []);
      setHasSearched(true);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const handleDetails = async (train) => {
    setSelectedTrain(train);
    setDetails(null);
    setDetailsError("");
    setDetailsLoading(true);

    try {
      const data = await getTrainDetails(
        train.train_id,
        from,
        to,
        date,
        token
      );
      setDetails(data);
    } catch {
      setDetailsError("Could not load train details. Refresh your search and try again.");
    } finally {
      setDetailsLoading(false);
    }
  };

  if (!user || !token) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-message">
          <h2>You are not logged in.</h2>
          <button onClick={() => navigate("/login")}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      {/* NAVBAR */}
      <nav className="dashboard-navbar">

        <div className="dashboard-logo">
          🚆 AmarRail
        </div>

        <div className="dashboard-user">

          <div className="user-info">
            <strong>{user.name}</strong>
            <span>
              {isAdmin ? "Administrator" : "Passenger"}
            </span>
          </div>

          <button type="button" className="ticket-nav-button" onClick={() => navigate("/my-tickets")}>
            My Tickets
          </button>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </nav>


      {/* MAIN CONTENT */}
      <main className="dashboard-content">

        {/* WELCOME */}
        <section className="welcome-section">

          <div>
            <p className="dashboard-small-title">
              AMARRAIL
            </p>

            <h1>
              Welcome, {user.name} 👋
            </h1>

            <p>
              Search for your train and plan your journey.
            </p>
          </div>

        </section>


        {/* SEARCH BOX */}
        <section className="search-section">

          <div className="section-heading">
            <h2>Search Trains</h2>
            <p>Find available trains for your journey.</p>
          </div>


          <form
            className="train-search-form"
            onSubmit={handleSearch}
          >

            <div className="search-field">

              <label>From</label>

              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              >
                <option value="">Select departure station</option>
                {stations.map((station) => <option key={station.station_id} value={station.station_name}>{station.station_name}{station.city ? ` · ${station.city}` : ""}</option>)}
              </select>

            </div>


            <div className="search-field">

              <label>To</label>

              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
              >
                <option value="">Select destination station</option>
                {stations.map((station) => <option key={station.station_id} value={station.station_name}>{station.station_name}{station.city ? ` · ${station.city}` : ""}</option>)}
              </select>

            </div>


            <div className="search-field">

              <label>Journey Date</label>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />

            </div>


            <button
              type="submit"
              className="search-button"
              disabled={loading}
            >
              {loading ? "Searching..." : "🔍 Search Train"}
            </button>

          </form>


          {error && (
            <div className="dashboard-error">
              {error}
            </div>
          )}

        </section>


        {/* SEARCH RESULTS */}
        {trains.length > 0 && (
  <section className="results-section">

    <div className="section-heading">
      <h2>Available Trains</h2>
      <p>
        {trains.length} train(s) found.
      </p>
    </div>

    <div className="train-results">

      {trains.map((train, index) => (

        <div
          className="train-card"
          key={`${train.train_name}-${index}`}
        >

          <div className="train-card-header">

            <div>
              <span className="train-label">
                TRAIN
              </span>

              <h3>
                {train.train_name}
              </h3>
            </div>

            <span className="train-number">
              Route #{train.route_id}
            </span>

          </div>


          <div className="train-route">

            <div>
              <span>From</span>

              <strong>
                {from}
              </strong>

              <small>
                Departure:{" "}
                {train.departure_from_source || "N/A"}
              </small>
            </div>


            <div className="route-arrow">
              →
            </div>


            <div>
              <span>To</span>

              <strong>
                {to}
              </strong>

              <small>
                Arrival:{" "}
                {train.arrival_at_destination || "N/A"}
              </small>
            </div>

          </div>


          <div className="train-card-footer">

            <span>
              📅 {date}
            </span>

            <button
              className="details-button"
              onClick={() => handleDetails(train)}
            >
              View Details
            </button>

          </div>

        </div>

      ))}

    </div>

  </section>
)}

        {selectedTrain && (
          <section className="train-details-section">
            <div className="section-heading">
              <div>
                <p className="dashboard-small-title">TRAIN DETAILS</p>
                <h2>{selectedTrain.train_name}</h2>
                <p>{from} → {to} · {date}</p>
              </div>
              <button className="details-button" onClick={() => setSelectedTrain(null)}>Close</button>
            </div>

            {detailsLoading && <p>Loading train details...</p>}
            {detailsError && <div className="dashboard-error">{detailsError}</div>}

            {details && (
              <>
                <div className="train-detail-overview">
                  <div>
                    <span>Route</span>
                    <strong>{details.route.map((station) => station.station_name).join(" → ")}</strong>
                  </div>
                  <div>
                    <span>Departure</span>
                    <strong>{selectedTrain.departure_from_source || "Time unavailable"}</strong>
                  </div>
                  <div>
                    <span>Arrival</span>
                    <strong>{selectedTrain.arrival_at_destination || "Time unavailable"}</strong>
                  </div>
                </div>
                {journey && <SeatBookingPanel train={selectedTrain} details={details} journey={journey} token={token} />}
              </>
            )}
          </section>
        )}

        {hasSearched && !loading && !error && trains.length === 0 && (
          <section className="results-section no-trains-message" role="status">
            <h2>No trains available</h2>
            <p>No trains were found for this route and date. Try different stations or another date.</p>
          </section>
        )}


        {isAdmin && (
          <section className="admin-section">
            <div className="section-heading">
              <div>
                <p className="admin-label">ADMINISTRATION</p>
                <h2>Management Center</h2>
                <p>Manage trains, schedules, stations, and routes.</p>
              </div>
            </div>
            <div className="admin-grid">
              <a href="/admin/manage" className="admin-card">
                <div className="admin-card-icon">🛠️</div>
                <h3>Management Center</h3>
                <p>Open railway management tools.</p>
              </a>
            </div>
          </section>
        )}

      </main>

    </div>
  );
}

export default Dashboard;
