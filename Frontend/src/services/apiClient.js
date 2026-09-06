import axios from 'axios';

const rawApiUrl = (import.meta.env.VITE_API_URL || 'https://projectgo-backend.onrender.com').trim().replace(/\/+$/, '');
const baseURL = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`)
  : 'https://projectgo-backend.onrender.com/api';

const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success !== undefined) {
      return { ...response, data: response.data.data};
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;