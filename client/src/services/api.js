


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


export const addTrain = async (train_name, route_id, token) => {
  const response = await fetch(`${API_URL}/trains/addTrain`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      train_name,
      route_id,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to add train");
  }

  return data;
};


export const addCoach = async (
  train_id,
  coach_name,
  seats,
  type,
  token
) => {
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