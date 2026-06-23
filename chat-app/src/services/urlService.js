
import axios from "axios";

const API_URL = "https://chat-app-095d.onrender.com/api"; // Replace with your actual API URL  

const axoisInstance = axios.create({
  baseURL: API_URL,
 withCredentials: true,
});


export default axoisInstance;