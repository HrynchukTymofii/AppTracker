import axios from "axios";

export const API_BASE_URL = "https://www.fibipals.com";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/apps/appBlocker`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 second timeout to prevent hanging forever
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('API request timed out');
    } else if (!error.response) {
      console.error('Network error - no response received');
    }
    return Promise.reject(error);
  }
);

export default api;
