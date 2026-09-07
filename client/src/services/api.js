// import axios from "axios";

// const api = axios.create({
// 	baseURL: "http://localhost:5000/api",
// 	headers: {
// 		"Content-Type": "application/json",
// 	},
// });

// const getErrorMessage = (error) => {
// 	return error.response?.data?.error || "Something went wrong. Please try again.";
// };

// export const loginUser = async (phone, password) => {
// 	try {
// 		const response = await api.post("/auth/login", { phone, password });
// 		return response.data;
// 	} catch (error) {
// 		throw new Error(getErrorMessage(error));
// 	}
// };

// export const registerUser = async (user) => {
// 	try {
// 		const response = await api.post("/auth/register", user);
// 		return response.data;
// 	} catch (error) {
// 		throw new Error(getErrorMessage(error));
// 	}
// };


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