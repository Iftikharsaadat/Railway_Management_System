


const API_URL = "http://localhost:5000/api";


// =========================
// LOGIN
// =========================

export const loginUser = async (phone, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      phone,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Login failed");
  }

  return data;
};


// =========================
// REGISTER
// =========================

export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Registration failed");
  }

  return data;
};

// =========================
// TRAIN SEARCH
// =========================


export const searchTrains = async (from, to, date, token) => {
  const response = await fetch(`${API_URL}/trains/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      from,
      to,
      date,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Train search failed");
  }

  return data;
};


// =============================
// ADMIN API FUNCTIONS
// =============================

export const addStation = async (station_name, city, token) => {
  const response = await fetch(`${API_URL}/trains/addStation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      station_name,
      city,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to add station");
  }

  return data;
};


export const addRoute = async (
  start_station_id,
  end_station_id,
  stations,
  token
) => {
  const response = await fetch(`${API_URL}/trains/addRoute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      start_station_id,
      end_station_id,
      stations,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to add route");
  }

  return data;
};


export const addStationToRoute = async (
  route_id,
  station_id,
  sequence_no,
  arrival_time,
  departure_time,
  distance_km,
  token
) => {
  const response = await fetch(`${API_URL}/trains/addStationToRoute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      route_id,
      station_id,
      sequence_no,
      arrival_time,
      departure_time,
      distance_km,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to add station to route");
  }

  return data;
};


export const addTrain = async (train_name, route_id, off_day, token) => {
  const response = await fetch(`${API_URL}/trains/addTrain`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      train_name,
      route_id,
      off_day: off_day || null,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to add train");
  }

  return data;
};

export const getTrainDetails = async (trainId, from, to, date, token) => {
  const params = new URLSearchParams({ from, to, date });
  const response = await fetch(
    `${API_URL}/trains/train_details/${trainId}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load train details");
  }

  return data;
};


export const addCoach = async (train_id,coach_name,seats,type,token ) => {
  const response = await fetch(`${API_URL}/trains/addCoach`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      train_id,
      coach_name,
      seats,
      type,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to add coach");
  }

  return data;
};

const adminRequest = async (path, token, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
};

export const getAdminTrains = (search, token) =>
  adminRequest(`/trains/admin/trains?search=${encodeURIComponent(search || "")}`, token);

export const getAdminStations = (search, token) =>
  adminRequest(`/trains/admin/stations?search=${encodeURIComponent(search || "")}`, token);

export const getRoute = (routeId, token) =>
  adminRequest(`/trains/route/${routeId}`, token);

export const getTrainCoaches = (trainId, token) =>
  adminRequest(`/trains/admin/trains/${trainId}/coaches`, token);

export const getSchedule = (scheduleId, token) =>
  adminRequest(`/trains/admin/schedules/${scheduleId}`, token);

export const getAdminSchedules = (search, token) =>
  adminRequest(`/trains/admin/schedules?search=${encodeURIComponent(search || "")}`, token);

export const updateTrain = (trainId, body, token) =>
  adminRequest(`/trains/updateTrain/${trainId}`, token, { method: "PUT", body: JSON.stringify(body) });

export const updateStation = (stationId, body, token) =>
  adminRequest(`/trains/updateStation/${stationId}`, token, { method: "PUT", body: JSON.stringify(body) });

export const updateCoach = (coachId, body, token) =>
  adminRequest(`/trains/updateCoach/${coachId}`, token, { method: "PUT", body: JSON.stringify(body) });

export const updateRouteStation = (routeId, stationId, body, token) =>
  adminRequest(`/trains/updateRouteStation/${routeId}/${stationId}`, token, { method: "PUT", body: JSON.stringify(body) });

export const updateSchedule = (scheduleId, body, token) =>
  adminRequest(`/trains/updateSchedule/${scheduleId}`, token, { method: "PUT", body: JSON.stringify(body) });

export const addSchedule = (body, token) =>
  adminRequest("/trains/addSchedule", token, { method: "POST", body: JSON.stringify(body) });

export const addStationToRouteAdmin = (body, token) =>
  adminRequest("/trains/addStationToRoute", token, { method: "POST", body: JSON.stringify(body) });

export const deleteStationFromRoute = (routeId, stationId, token) =>
  adminRequest(`/trains/deleteStationFromRoute/${routeId}/${stationId}`, token, { method: "DELETE" });


// =====================================================
// ADMIN DELETE API FUNCTIONS
// =====================================================

const adminDelete = async (endpoint, token) => {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      method: "DELETE",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Delete operation failed"
    );
  }

  return data;
};


// =====================================================
// DELETE TRAIN
// =====================================================

export const deleteTrain = (
  trainId,
  token
) => {
  return adminDelete(
    `/trains/deleteTrain/${trainId}`,
    token
  );
};


// =====================================================
// DELETE COACH
// =====================================================

export const deleteCoach = (
  coachId,
  token
) => {
  return adminDelete(
    `/trains/deleteCoach/${coachId}`,
    token
  );
};


// =====================================================
// DELETE ROUTE
// =====================================================

export const deleteRoute = (
  routeId,
  token
) => {
  return adminDelete(
    `/trains/deleteRoute/${routeId}`,
    token
  );
};


// =====================================================
// DELETE SCHEDULE
// =====================================================

export const deleteSchedule = (
  scheduleId,
  token
) => {
  return adminDelete(
    `/trains/deleteSchedule/${scheduleId}`,
    token
  );
};


// =====================================================
// DELETE STATION
// =====================================================

export const deleteStation = (
  stationId,
  token
) => {
  return adminDelete(
    `/trains/deleteStation/${stationId}`,
    token
  );
};

