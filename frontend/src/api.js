import axios from "axios";

const API_BASE = "http://localhost:8000";

export function setAuthHeader(token) {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
}

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// ⭐ FIX: Proper 401 handling ONLY for real API requests
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    if (status === 401 && url && url.includes("/api")) {
      localStorage.removeItem("token");
      setAuthHeader(null);
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);
