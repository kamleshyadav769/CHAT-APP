
import axios from "axios";

const API_URL = "http://localhost:5045/api";

const axoisInstance = axios.create({
  baseURL: API_URL,
 withCredentials: true,
});


export default axoisInstance;