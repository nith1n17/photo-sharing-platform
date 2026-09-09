import axios from "axios";
import { getAccessToken } from "../utils/auth";

const api = axios.create({
    baseURL: "https://photo-sharing-platform-9145.onrender.com/api/",
    withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;