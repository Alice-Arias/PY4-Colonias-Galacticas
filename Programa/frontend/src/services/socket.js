import { io } from "socket.io-client";

// ======================================================
// Cliente Socket (Socket.IO)
// Conexión en tiempo real con el backend
// ======================================================

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  transports: ["websocket"]
});

export default socket;
