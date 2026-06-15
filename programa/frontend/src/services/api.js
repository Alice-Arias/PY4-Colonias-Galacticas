import axios from "axios";

const api = axios.create({
  baseURL: "https://hardener-moonstone-epidermis.ngrok-free.dev"
});

export default api;