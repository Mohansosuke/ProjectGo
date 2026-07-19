import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api',
  withCredentials: true,
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