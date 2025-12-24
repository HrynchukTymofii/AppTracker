import axios from "axios";

export const API_BASE_URL = "https://www.fibipals.com";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/apps/appBlocker`,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
