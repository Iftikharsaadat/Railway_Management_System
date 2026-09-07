import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

import AddStation from "./pages/AddStation";
import AddRoute from "./pages/AddRoute";
import AddStationToRoute from "./pages/AddStationToRoute";
import AddTrain from "./pages/AddTrain";
import AddCoach from "./pages/AddCoach";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* ADMIN ROUTES */}

        <Route
          path="/admin/add-station"
          element={<AddStation />}
        />

        <Route
          path="/admin/add-route"
          element={<AddRoute />}
        />

        <Route
          path="/admin/add-station-to-route"
          element={<AddStationToRoute />}
        />

        <Route
          path="/admin/add-train"
          element={<AddTrain />}
        />

        <Route
          path="/admin/add-coach"
          element={<AddCoach />}
        />

        <Route
          path="*"
          element={<Home />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;