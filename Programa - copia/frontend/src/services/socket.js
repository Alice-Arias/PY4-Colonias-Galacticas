import { io } from "socket.io-client";

// ======================================================
// Cliente Socket (Socket.IO)
// Conexión en tiempo real con el backend
// ======================================================

// Cambia esto según tu entorno (local o ngrok)
const socket = io("http://localhost:3002", {
    transports: ["websocket"]
});

// Si usas ngrok en el futuro:
// const socket = io("https://TU-URL-NGROK.ngrok-free.app", {
//   transports: ["websocket"]
// });

export default socket;