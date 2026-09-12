import axios from "axios";

const api = axios.create({
 baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("student_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("student_token");
      localStorage.removeItem("student_user");
    }
    return Promise.reject(error);
  },
);

export default api;