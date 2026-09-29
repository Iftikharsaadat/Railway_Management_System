import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

import AddStation from "./pages/AddStation";
import AddRoute from "./pages/AddRoute";
import AddStationToRoute from "./pages/AddStationToRoute";
import AddTrain from "./pages/AddTrain";
import AddCoach from "./pages/AddCoach";
import DeleteAdmin from "./pages/DeleteAdmin";
import AdminManagement from "./pages/AdminManagement";
import ConfirmationPage from "./pages/ConfirmationPage";
import TicketPage from "./pages/TicketPage";
import MyTickets from "./pages/MyTickets";

function RequireAuth({ children, role }) {
  const token = localStorage.getItem("token");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  if (!token || !user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        <Route path="/booking/confirm" element={<RequireAuth><ConfirmationPage /></RequireAuth>} />
        <Route path="/booking/ticket/:ticketId" element={<RequireAuth><TicketPage /></RequireAuth>} />
        <Route path="/my-tickets" element={<RequireAuth><MyTickets /></RequireAuth>} />

        <Route
          path="/dashboard"
          element={<RequireAuth><Dashboard /></RequireAuth>}
        />

        {/* ADMIN ROUTES */}

        <Route
          path="/admin/add-station"
          element={<RequireAuth role="admin"><AddStation /></RequireAuth>}
        />

        <Route
          path="/admin/add-route"
          element={<RequireAuth role="admin"><AddRoute /></RequireAuth>}
        />

        <Route
          path="/admin/add-station-to-route"
          element={<RequireAuth role="admin"><AddStationToRoute /></RequireAuth>}
        />

        <Route
          path="/admin/add-train"
          element={<RequireAuth role="admin"><AddTrain /></RequireAuth>}
        />

        <Route
          path="/admin/add-coach"
          element={<RequireAuth role="admin"><AddCoach /></RequireAuth>}
        />

        <Route
          path="*"
          element={<Home />}
        />

        <Route path="/admin/delete" element={<RequireAuth role="admin"><DeleteAdmin /></RequireAuth>} />

        <Route path="/admin/manage" element={<RequireAuth role="admin"><AdminManagement /></RequireAuth>} />
        <Route path="/admin/manage/route/:routeId" element={<RequireAuth role="admin"><AdminManagement /></RequireAuth>} />
        <Route path="/admin/manage/train/:trainId/coaches" element={<RequireAuth role="admin"><AdminManagement /></RequireAuth>} />

      </Routes>

    </BrowserRouter>
  );
}

export default App;
