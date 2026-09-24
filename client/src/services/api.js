


const API_URL = "http://localhost:5000/api";

const adminGet = async (path, token) => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Admin request failed");
  return data;
};

export const getAdminOverview = (token) => adminGet("/trains/admin/overview", token);
export const getAdminRoute = (routeId, token) => adminGet(`/trains/admin/routes/${routeId}`, token);
export const getAdminCoaches = (trainId, token) => adminGet(`/trains/admin/trains/${trainId}/coaches`, token);
export const getAdminSeats = (coachId, token) => adminGet(`/trains/admin/coaches/${coachId}/seats`, token);


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

export const updateRoute = async (routeId, stations, token) => {
  const response = await fetch(`${API_URL}/trains/updateRoute/${routeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ stations }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to update route");
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

export const addTrainWithRoute = async (train_name, off_day, stations, token) => {
  const response = await fetch(`${API_URL}/trains/addTrainWithRoute`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ train_name, off_day: off_day || null, stations }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to create route and train");
  return data;
};

export const updateTrain = async (trainId, train_name, off_day, token) => {
  const response = await fetch(`${API_URL}/trains/updateTrain/${trainId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ train_name, off_day: off_day || null }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to update train");
  return data;
};

export const updateSchedule = async (scheduleId, schedule, token) => {
  const response = await fetch(`${API_URL}/trains/updateSchedule/${scheduleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(schedule),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to update schedule");
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

