import { io } from "socket.io-client";

// ======================================================
// NOMBRE: Cliente Socket (Socket.IO)
// ENTRADA: conexión del frontend al servidor en tiempo real
// SALIDA: eventos en tiempo real (lobby, juego, galaxia, etc.)
// RESTRICCIONES:
// - el servidor debe estar activo en la URL indicada
// - ngrok puede cambiar y romper la conexión
// - requiere Socket.IO en backend
// OBJETIVO:
// Manejar comunicación en tiempo real del juego multijugador
// ======================================================
const socket = io("https://hardener-moonstone-epidermis.ngrok-free.dev", {
    transports: ["websocket"]
});

export default socket;