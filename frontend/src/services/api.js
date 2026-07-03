import axios from "axios";

// Base API configuration
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial for sending and receiving HttpOnly cookies (refresh token)
  headers: {
    "Content-Type": "application/json",
  },
});

let accessToken = "";
let isRefreshing = false;
let failedQueue = [];

// Helper to set token in memory
export const setAccessToken = (token) => {
  accessToken = token;
};

// Helper to get current token
export const getAccessToken = () => {
  return accessToken;
};

// Process any queued requests during token refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach access token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catch 401s and refresh token
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401, not already retried, and not a login/signup attempt
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/login") &&
      !originalRequest.url.includes("/auth/signup")
    ) {
      if (isRefreshing) {
        // Queue this request while token is refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint to get new access token (HttpOnly cookie sent automatically)
        const response = await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = response.data.data.accessToken;
        setAccessToken(newAccessToken);

        // Process queue with new token
        processQueue(null, newAccessToken);
        isRefreshing = false;

        // Retry the original request
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        setAccessToken("");
        
        // Dispatch custom event so AuthContext can clean up state and redirect to login
        window.dispatchEvent(new Event("auth:unauthorized"));
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
