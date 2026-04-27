import axios from "axios";

const API = axios.create({
  baseURL: "https://to-do-list-bq9f.onrender.com",
  timeout: 10000,
});

// Request interceptor
API.interceptors.request.use(
  (config) => {
    console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
API.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} Response received`);
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || error.message;
    console.error("❌ API Error:", message);
    return Promise.reject(error);
  }
);

export default API;
