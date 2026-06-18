import axios from 'axios';
import { LS_TOKEN_KEY } from '../utils/constants';

const apiClientV2 = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace('/api/v1', '/api/v2'),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // LLM requests might take longer, so 30s timeout is better
  withCredentials: true,
});

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

// Request Interceptor: Attach token + shopId
apiClientV2.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(LS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const activeShop = localStorage.getItem('aroma_active_shop');
      if (activeShop) {
        const { id } = JSON.parse(activeShop);
        if (id) {
          config.headers['x-shop-id'] = id;
        }
      }
    } catch (e) {
      // Ignore
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle token refresh on 401
apiClientV2.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
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
            return apiClientV2(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // We use v1 refresh endpoint
        const refreshBase = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1');
        const response = await axios.post(
          `${refreshBase}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const { token: newAccessToken } = response.data?.data || response.data;
        localStorage.setItem(LS_TOKEN_KEY, newAccessToken);

        apiClientV2.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        isRefreshing = false;
        return apiClientV2(originalRequest);
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

export default apiClientV2;
