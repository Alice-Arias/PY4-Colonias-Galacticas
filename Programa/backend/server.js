// ======================================================
// NOMBRE: Servidor principal multijugador (Socket + Express)
// ENTRADA: peticiones HTTP y eventos Socket.IO
// SALIDA: gestión de partidas en tiempo real
// RESTRICCIONES:
// - No duplicar IDs de partidas
// - Mantener sincronización entre clientes
// - Evitar acceso a partidas inexistentes
// OBJETIVO:
// Controlar todo el sistema multijugador en tiempo real
// ======================================================

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const { crearUniverso, iniciarProduccion } = require("./game/universo");
const { construir } = require("./game/construccion");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" },
});

global.io = io;

// ======================================================
// NOMBRE: Almacenamiento de partidas en memoria
// ENTRADA: creación de partidas
// SALIDA: estado global de todas las partidas activas
// RESTRICCIONES:
// - No persistente (se pierde al reiniciar servidor)
// - Debe mantenerse sincronizado con sockets
// OBJETIVO:
// Mantener control de partidas activas en el servidor
// ======================================================
const partidas = {};

// ======================================================
// NOMBRE: Conexión de jugadores
// ENTRADA: socket de usuario
// SALIDA: eventos de juego en tiempo real
// RESTRICCIONES:
// - Cada socket representa un jugador único
// - Debe desconectarse correctamente
// OBJETIVO:
// Gestionar comunicación en tiempo real entre jugadores
// ======================================================
io.on("connection", (socket) => {
    console.log("Jugador conectado:", socket.id);

  // ======================================================
  // NOMBRE: Crear partida
  // ENTRADA: configuración de partida (nombre, max jugadores, nickname)
  // SALIDA: nueva partida creada y emitida a clientes
  // RESTRICCIONES:
  // - ID debe ser único
  // - El creador se convierte en host
  // - No puede exceder lógica del sistema
  // OBJETIVO:
  // Crear una sala de juego nueva
  // ======================================================
    socket.on("create_game", (config) => {
    const id = Math.random().toString(36).substring(2, 8);

    const partida = {
        id,
        nombre: config.nombre,
        maxJugadores: config.maxJugadores,
        tiempoMax: config.tiempoMax,
        recursosIniciales: config.recursosIniciales,
        estado: "esperando",
        host: socket.id,
        jugadores: [],
    };

    partidas[id] = partida;

    socket.join(id);

    // Host entra automáticamente a la partida
    partida.jugadores.push({
        id: socket.id,
        nickname: config.nickname,
        host: true,
    });

    io.to(id).emit("lobby_update", partida);
    io.emit("partida_creada", partida);
    });

  // ======================================================
  // NOMBRE: Unirse a partida
  // ENTRADA: id de partida y nickname
  // SALIDA: jugador agregado al lobby
  // RESTRICCIONES:
  // - No puede exceder max jugadores
  // - No duplicar jugadores
  // - Partida debe existir
  // OBJETIVO:
  // Permitir entrada de jugadores al lobby
  // ======================================================
    socket.on("join_game", ({ partidaId, nickname }) => {
    const partida = partidas[partidaId];
    if (!partida) return;

    if (partida.jugadores.length >= partida.maxJugadores) return;

    const existe = partida.jugadores.find((j) => j.id === socket.id);

    if (!existe) {
        partida.jugadores.push({
        id: socket.id,
        nickname,
        host: false,
        });
    }

    socket.join(partidaId);
    io.to(partidaId).emit("lobby_update", partida);
    });

  // ======================================================
  // NOMBRE: Iniciar partida con countdown
  // ENTRADA: id de partida
  // SALIDA: cuenta regresiva y comienzo del juego
  // RESTRICCIONES:
  // - Solo host puede iniciar
  // - Mínimo 2 jugadores
  // - No iniciar si partida no existe
  // OBJETIVO:
  // Controlar inicio sincronizado del juego
  // ======================================================
    socket.on("start_game", (partidaId) => {
        const partida = partidas[partidaId];
        if (!partida) return;

        if (partida.host !== socket.id) return;

        if (partida.jugadores.length < 2) {
            socket.emit("error_start", {
                mensaje: "Se necesitan mínimo 2 jugadores",
            });
            return;
        }

  // ======================================================
  // NOMBRE: Inicializar galaxia y jugadores al iniciar partida
  // ENTRADA: partida con jugadores y recursosIniciales
  // SALIDA: galaxia asignada, planeta base y recursos por jugador
  // RESTRICCIONES:
  // - Cada jugador recibe un planeta distinto
  // - El sistema base pasa a estado "controlado"
  // - recursosIniciales debe existir en la partida
  // OBJETIVO:
  // Preparar el estado inicial del juego para todos los jugadores
  // ======================================================
        partida.galaxia = crearUniverso();

        const sistemasDisponibles = [...partida.galaxia.sistemas];

        partida.jugadores.forEach((jugador) => {
            const idx = Math.floor(Math.random() * sistemasDisponibles.length);
            const planetaBase = sistemasDisponibles.splice(idx, 1)[0];

            planetaBase.propietario = jugador.nickname;
            planetaBase.estado = "controlado";

            jugador.planetaBase = planetaBase.id;
            jugador.recursos = { ...partida.recursosIniciales };
            jugador.eliminado = false;
        });

        partida.estado = "countdown";

        let t = 5;

        const interval = setInterval(() => {
            io.to(partidaId).emit("countdown", t);
            t--;

            if (t < 0) {
                clearInterval(interval);

                partida.estado = "jugando";

                iniciarProduccion(partida);

                io.to(partidaId).emit("game_started", { partida });
            }
        }, 1000);
    });

  // ======================================================
  // NOMBRE: Construir instalación en un sistema
  // ENTRADA: { partidaId, sistemaId, tipo }
  // SALIDA: instalación agregada, recursos descontados, galaxia_update emitido
  // RESTRICCIONES:
  // - La partida debe estar en estado "jugando"
  // - Validaciones delegadas a construccion.js
  // OBJETIVO:
  // Recibir solicitud de construcción y coordinar respuesta a clientes
  // ======================================================
    socket.on("build", ({ partidaId, sistemaId, tipo }) => {
        const partida = partidas[partidaId];
        if (!partida || partida.estado !== "jugando") return;

        const resultado = construir(partida, socket.id, sistemaId, tipo);

        if (!resultado.ok) {
            socket.emit("error_build", { mensaje: resultado.error });
            return;
        }

        io.to(partidaId).emit("galaxia_update", partida.galaxia);
        socket.emit("recursos_update", resultado.jugador.recursos);
    });

  // ======================================================
  // NOMBRE: Desconexión de jugador
  // ENTRADA: socket desconectado
  // SALIDA: jugador eliminado de partidas activas
  // RESTRICCIONES:
  // - No debe dejar referencias inválidas
  // - Debe limpiar correctamente todas las partidas
  // OBJETIVO:
  // Mantener integridad del estado del servidor
  // ======================================================
    socket.on("disconnect", () => {
    Object.values(partidas).forEach((p) => {
        p.jugadores = p.jugadores.filter((j) => j.id !== socket.id);
    });
    });
});
app.get("/", (req, res) => {
    res.json({
    ok: true,
    mensaje: "Servidor multijugador activo ",
    });
});
// ======================================================
// NOMBRE: Inicio del servidor
// ENTRADA: puerto 3002
// SALIDA: servidor activo
// RESTRICCIONES:
// - Puerto debe estar libre
// OBJETIVO:
// Levantar backend multijugador en tiempo real
// ======================================================
server.listen(3002, "0.0.0.0", () => {
    console.log("Servidor multiplayer listo ");
});
