import axios from 'axios';
import { LS_TOKEN_KEY } from '../utils/constants';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true, // Enable automatically sending/receiving cookies for cross-origin requests
});

// Flag to prevent concurrent refresh requests
let isRefreshing = false;
let failedQueue = [];

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

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Attach Bearer token from localStorage to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(LS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// On 401: try to refresh token and retry failed requests, otherwise log out
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // On 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If the 401 is from the refresh-token endpoint itself, log out immediately
      if (originalRequest.url?.includes('/auth/refresh-token')) {
        localStorage.removeItem(LS_TOKEN_KEY);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Direct axios call with credentials enabled to pass/receive cookies securely
        const response = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh-token`,
          {}, // Empty body as the refresh token resides in a secure httpOnly cookie
          { withCredentials: true }
        );
        
        const { token: newAccessToken } = response.data?.data || response.data;
        
        localStorage.setItem(LS_TOKEN_KEY, newAccessToken);

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        isRefreshing = false;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem(LS_TOKEN_KEY);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Extract and sanitize the error message from an Axios error response.
 */
export const getErrorMessage = (error) => {
  const rawMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Something went wrong. Please try again.';

  if (typeof rawMessage === 'string') {
    const lowerMsg = rawMessage.toLowerCase();
    
    // Check if the message contains technical backend/database details
    if (
      lowerMsg.includes('prisma') ||
      lowerMsg.includes('database') ||
      lowerMsg.includes('sql') ||
      lowerMsg.includes('invocation') ||
      lowerMsg.includes('unique constraint') ||
      lowerMsg.includes('foreign key') ||
      lowerMsg.includes('connectdb') ||
      rawMessage.includes('\\') ||
      rawMessage.includes('/')
    ) {
      return 'Something went wrong. Please try again.';
    }
  }

  return rawMessage;
};

export default apiClient;
