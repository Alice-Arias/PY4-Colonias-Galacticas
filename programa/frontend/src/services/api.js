// ==============================================================================================
// NOMBRE: api.js
// ENTRADA: configuración base de peticiones HTTP
// SALIDA: cliente Axios reutilizable
// RESTRICCIONES: centralizar URL y opciones compartidas
// OBJETIVO: centralizar el cliente HTTP para el frontend
// ==============================================================================================
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3002"
});

export default api;