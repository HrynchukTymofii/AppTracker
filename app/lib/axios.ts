import axios from "axios";

export const API_BASE_URL = "https://www.satlearner.com";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
