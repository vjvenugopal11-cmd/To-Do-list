import axios from "axios";

// ---------------- BASE URL ----------------
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://to-do-list-bq9f.onrender.com";

// ---------------- AXIOS INSTANCE ----------------
const API = axios.create({
  baseURL: `${BASE_URL}/api/tasks`,
  timeout: 60000,
});

// ---------------- REQUEST INTERCEPTOR ----------------
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = token;
    }

    console.log(
      `📤 ${config.method?.toUpperCase()} ${config.url}`
    );

    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

// ---------------- RESPONSE INTERCEPTOR ----------------
API.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} Response received`);
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.message || error.message;

    console.error("❌ API Error:", message);

    return Promise.reject(error);
  }
);

// ---------------- SERVER WAKE ----------------
export const pingServer = async () => {
  try {
    await axios.get(`${BASE_URL}/ping`, {
      timeout: 60000,
    });

    console.log("✅ Server is awake");
  } catch {
    console.log("⏳ Server waking up...");
  }
};

export default API;
