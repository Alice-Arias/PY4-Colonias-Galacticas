// -----------------------------
// Importaciones y configuración
// -----------------------------
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const app = express();
const servidorHttp = http.createServer(app);

// Servidor de WebSockets (Socket.IO)
const socketServidor = new Server(servidorHttp, {
    cors: { origin: "*" }
});

// Cargar galaxia desde JSON al arrancar

// Cargar galaxia desde JSON
// Este archivo contiene la definición de sistemas y rutas.
// Se carga una única vez al arrancar el servidor y se mantiene en memoria.

let galaxia = null;
try {
    const rutaGalaxia = path.join(__dirname, "data", "galaxia.json");
    const raw = fs.readFileSync(rutaGalaxia, "utf8");//raw es un string con el contenido del archivo JSON
    galaxia = JSON.parse(raw);
    console.log(`Galaxia cargada: ${galaxia.nombre} (${galaxia.sistemas.length} sistemas, ${galaxia.rutas.length} rutas)`);
} catch (err) {
    console.error("Error cargando galaxia:", err.message);
}


// Rutas HTTP básicas
//  GET /      : salud del servidor
//  GET /galaxia: devuelve la galaxia cargada

app.get("/", (req, res) => {
    res.send("Servidor de Colonias Galácticas activo");
});

app.get("/galaxia", (req, res) => {
    if (!galaxia) return res.status(500).json({ error: "Galaxia no cargada" });
    res.json(galaxia);
});


// WebSockets: manejo de conexiones
//  En esta sección se definirán los mensajes y salas (rooms) para partidas.
//  Actualmente: bienvenida y reenvío simple de chat.

socketServidor.on("connection", (socket) => {
    console.log(`Jugador conectado: ${socket.id}`);

    // Mensaje de bienvenida al cliente conectado
    socket.emit("mensaje", "Bienvenido al servidor");

    // Evento simple de chat (reenvía a todos los clientes)
    socket.on("chat", (mensaje) => {
        socketServidor.emit("chat", mensaje);
    });

    // Manejo de desconexión
    socket.on("disconnect", () => {
        console.log(`Jugador desconectado: ${socket.id}`);
    });
});

// Arranque del servidor
// Se usa la variable de entorno PORT si está disponible.

const PORT = process.env.PORT || 3000;

servidorHttp.listen(PORT, () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
});

// Manejo de errores en el servidor HTTP
servidorHttp.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
        console.error(`Error: puerto ${PORT} en uso. Use otra variable de entorno PORT o cierre el proceso que lo ocupa.`);
    } else {
        console.error('Error en el servidor HTTP:', err);
    }
});