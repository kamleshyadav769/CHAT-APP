
import axios from "axios";

const API_URL = "https://chat-app-095d.onrender.com/api"; // Replace with your actual API URL  

const getToken=()=>localStorage.getItem("auth_token");



const axoisInstance = axios.create({
  baseURL: API_URL,
// withCredentials: true,
});

axoisInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

export default axoisInstance;