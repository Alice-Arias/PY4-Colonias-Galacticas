// ==============================================================================================
// NOMBRE: server.js
// ENTRADA: peticiones HTTP, eventos Socket.IO y estado de partidas
// SALIDA: API del servidor, eventos en tiempo real y persistencia en memoria
// RESTRICCIONES: conservar compatibilidad con el cliente y las partidas activas
// OBJETIVO: servir el backend principal multijugador
// ==============================================================================================

const express = require("express");
const cors = require("cors");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");

const { Partida, crearUniverso, listarGalaxias } = require("./game/universo");
const LogicaJuego = require("./src/models/GameLogic");

const TEMATICAS_VALIDAS = new Set(["clasica", "aurora", "imperial", "abisal"]);

// ==============================================================================================
// NOMBRE: normalizarTematica
// ENTRADA: valor de temática recibido
// SALIDA: temática válida o valor por defecto
// RESTRICCIONES: solo permite valores definidos en TEMATICAS_VALIDAS
// OBJETIVO: mantener consistencia de temática entre cliente y servidor
// ==============================================================================================
function normalizarTematica(valor) {
    return TEMATICAS_VALIDAS.has(valor) ? valor : "clasica";
}

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, { cors: { origin: "*" } });
global.io = io;

// Almacenamiento de partidas en memoria
const partidasEnMemoria = {};
const historialPartidasPath = path.join(__dirname, "data", "historial_partidas.json");

// ==============================================================================================
// NOMBRE: cargarHistorialPartidas
// ENTRADA: sin entrada explícita
// SALIDA: arreglo de partidas históricas
// RESTRICCIONES: retorna arreglo vacío ante archivo inexistente o error
// OBJETIVO: restaurar historial persistido al iniciar el servidor
// ==============================================================================================
function cargarHistorialPartidas() {
    try {
        if (!fs.existsSync(historialPartidasPath)) {
            return [];
        }

        const contenido = fs.readFileSync(historialPartidasPath, "utf8");
        const datos = JSON.parse(contenido);
        return Array.isArray(datos) ? datos : [];
    } catch {
        return [];
    }
}

// ==============================================================================================
// NOMBRE: guardarHistorialPartidas
// ENTRADA: arreglo historial de partidas
// SALIDA: archivo JSON actualizado en disco
// RESTRICCIONES: crea la carpeta de destino si no existe
// OBJETIVO: persistir resultados históricos de partidas
// ==============================================================================================
function guardarHistorialPartidas(historial) {
    try {
        fs.mkdirSync(path.dirname(historialPartidasPath), { recursive: true });
        fs.writeFileSync(historialPartidasPath, JSON.stringify(historial, null, 2), "utf8");
    } catch (error) {
        console.error("No se pudo guardar el historial de partidas:", error.message);
    }
}

const historialPartidas = cargarHistorialPartidas();

// ==============================================================================================
// NOMBRE: ServidorJuego
// ENTRADA: instancias de app (Express) y io (Socket.IO)
// SALIDA: orquestador de rutas, sockets y ciclo de partidas
// RESTRICCIONES: depende de partidas en memoria y lógica de juego
// OBJETIVO: centralizar la operación del backend multijugador
// ==============================================================================================
class ServidorJuego {
    // ==============================================================================================
    // NOMBRE: constructor
    // ENTRADA: instancia de express y socket.io
    // SALIDA: servidor inicializado con rutas, sockets y limpieza periódica
    // RESTRICCIONES: requiere referencias válidas de app e io
    // OBJETIVO: preparar la orquestación principal del backend de juego
    // ==============================================================================================
    constructor(app, ioServer) {
        this.app = app;
        this.io = ioServer;
        this.partidas = partidasEnMemoria;
        this.configurarRutas();
        this.configurarSockets();
        this.iniciarLimpiezaPeriodicaPartidas();
    }

    // ======================================================
    // NOMBRE: serializarPartida
    // ENTRADA: objeto partida con datos completos en memoria
    // SALIDA: objeto plano seguro para enviar por sockets/API
    // RESTRICCIONES: no enviar referencias circulares ni métodos
    // OBJETIVO: exponer únicamente estado necesario del lobby
    // ======================================================
    serializarPartida(partida) {
        if (!partida) return null;

        return {
            id: partida.id,
            nombre: partida.nombre,
            maxJugadores: partida.maxJugadores,
            estado: partida.estado,
            host: partida.host,
            tiempoEspera: partida.tiempoEspera,
            tiempoMax: partida.tiempoMax,
            tematica: partida.tematica,
            recursosIniciales: partida.recursosIniciales,
            tiempoRestante: partida.obtenerTiempoRestante(),
            jugadores: partida.jugadores.map((jugador) => ({
                id: jugador.id,
                nickname: jugador.nickname,
                host: jugador.host,
            })),
            galaxia: partida.galaxia
                ? {
                    nombre: partida.galaxia.nombre,
                    sistemas: partida.galaxia.sistemas.map((sistema) => ({
                        id: sistema.id,
                        nombre: sistema.nombre,
                        tipo: sistema.tipo,
                        x: sistema.x,
                        y: sistema.y,
                        estado: sistema.estado,
                        propietario: sistema.propietario,
                        produccion: sistema.produccion,
                    })),
                    rutas: partida.galaxia.rutas,
                }
                : null,
        };
    }

    // ======================================================
    // NOMBRE: iniciarLimpiezaPeriodicaPartidas
    // ENTRADA: sin entrada explícita (usa this.partidas)
    // SALIDA: timers activos de limpieza y actualización de tiempo
    // RESTRICCIONES: ejecutar de forma periódica y segura
    // OBJETIVO: evitar partidas expiradas y mantener lobby vivo
    // ======================================================
    iniciarLimpiezaPeriodicaPartidas() {
        // Limpiar partidas expiradas periódicamente
        setInterval(() => this.limpiarPartidasExpiradas(), 5000);

        // Emitir tiempo restante para partidas en espera
        setInterval(() => {
            Object.entries(this.partidas).forEach(([id, partida]) => {
                if (partida && partida.estado === "esperando") {
                    this.io.to(id).emit("tiempo_restante_update", {
                        tiempoRestante: partida.obtenerTiempoRestante(),
                    });
                }
            });
        }, 1000);
    }

    // ======================================================
    // NOMBRE: configurarRutas
    // ENTRADA: instancia de app express
    // SALIDA: endpoints HTTP registrados
    // RESTRICCIONES: responder JSON simple y estable
    // OBJETIVO: exponer salud del servidor y listado de galaxias
    // ======================================================
    configurarRutas() {
        this.app.get("/", (req, res) => {
            res.json({ ok: true, mensaje: "Servidor multijugador activo" });
        });

        this.app.get("/galaxias", (req, res) => {
            res.json({ ok: true, galaxias: listarGalaxias() });
        });

        this.app.get("/ranking/historico", (req, res) => {
            res.json({ ok: true, historial: historialPartidas });
        });
    }

    // ======================================================
    // NOMBRE: crearPartida
    // ENTRADA: configuración de partida + socket del host
    // SALIDA: partida creada en memoria y eventos de lobby
    // RESTRICCIONES: galaxia válida y host conectado
    // OBJETIVO: iniciar una sala lista para recibir jugadores
    // ======================================================
    crearPartida(configuracionPartida, socket) {
        const id = Math.random().toString(36).substring(2, 8);
        const galaxia = crearUniverso(configuracionPartida.galaxia);
        const tematica = normalizarTematica(configuracionPartida.tematica);

        const partida = new Partida({
            id,
            nombre: configuracionPartida.nombre,
            maxJugadores: configuracionPartida.maxJugadores,
            host: socket.id,
            galaxia,
            tiempoEspera: configuracionPartida.tiempoEspera || 300,
            tiempoMax: configuracionPartida.tiempoMax || 1800,
            tematica,
            recursosIniciales: configuracionPartida.recursosIniciales,
        });

        partida.porcentajeVictoria = configuracionPartida.porcentajeVictoria || 0.6;

        partida.agregarJugador({ id: socket.id, nickname: configuracionPartida.nickname, host: true });

        this.partidas[id] = partida;

        socket.join(id);

        const payload = this.serializarPartida(partida);
        this.io.to(id).emit("lobby_update", payload);
        socket.emit("partida_creada", payload);
    }

    // ======================================================
    // NOMBRE: unirPartida
    // ENTRADA: partidaId, nickname y socket del cliente
    // SALIDA: unión al lobby o reenganche a partida activa
    // RESTRICCIONES: capacidad máxima y consistencia de identidad
    // OBJETIVO: permitir ingreso/reingreso sin romper estado
    // ======================================================
    unirPartida({ partidaId, nickname }, socket) {
        const partida = this.partidas[partidaId];
        if (!partida) return;

        const jugadorPorSocket = partida.jugadores.find((jugador) => jugador.id === socket.id);
        const jugadorPorNickname = partida.jugadores.find((jugador) => jugador.nickname === nickname);
        const yaExiste = Boolean(jugadorPorSocket || jugadorPorNickname);

        if (!yaExiste && partida.jugadores.length >= partida.maxJugadores) {
            socket.emit("join_error", { mensaje: "La partida está llena" });
            return;
        }

        if (!yaExiste) {
            partida.agregarJugador({ id: socket.id, nickname, host: false });
        } else if (jugadorPorNickname && jugadorPorNickname.id !== socket.id) {
            const oldSocketId = jugadorPorNickname.id;
            jugadorPorNickname.id = socket.id;
            jugadorPorNickname.desconectado = false;

            if (partida.host === oldSocketId) {
                partida.host = socket.id;
            }

            if (partida.gameLogic?.reasignarSocketJugador) {
                partida.gameLogic.reasignarSocketJugador(oldSocketId, socket.id, nickname);
            }
        } else if (jugadorPorSocket) {
            jugadorPorSocket.desconectado = false;
        }

        socket.join(partidaId);

        const payload = this.serializarPartida(partida);
        socket.emit("joined_game", payload);

        if (partida.estado === "jugando" && partida.gameLogic) {
            socket.emit("game_started", {
                partida: payload,
                estadoJuego: partida.gameLogic.obtenerEstadoPartida(),
                countdownFinalizado: true,
            });
            socket.emit("game_state_update", partida.gameLogic.obtenerEstadoPartida());
        } else {
            this.io.to(partidaId).emit("lobby_update", payload);
        }
    }

    // ======================================================
    // NOMBRE: obtenerPartidasDisponibles
    // ENTRADA: sin entrada explícita (usa this.partidas)
    // SALIDA: arreglo de partidas aptas para unirse
    // RESTRICCIONES: excluir partidas llenas/expiradas/no esperando
    // OBJETIVO: alimentar listado del lobby de unión
    // ======================================================
    obtenerPartidasDisponibles() {
        return Object.values(this.partidas)
            .filter((partida) => partida && partida.jugadores.length < partida.maxJugadores && partida.estado === "esperando" && !partida.estaExpirada())
            .map((partida) => ({
                id: partida.id,
                nombre: partida.nombre,
                nombreGalaxia: partida.galaxia.nombre,
                jugadoresActuales: partida.jugadores.length,
                maxJugadores: partida.maxJugadores,
                estado: partida.estado,
                host: partida.host,
                tiempoRestante: partida.obtenerTiempoRestante(),
            }));
    }

    // ======================================================
    // NOMBRE: limpiarPartidasExpiradas
    // ENTRADA: sin entrada explícita (usa this.partidas)
    // SALIDA: cantidad de partidas eliminadas
    // RESTRICCIONES: notificar expiración antes de eliminar
    // OBJETIVO: mantener memoria limpia y estado coherente
    // ======================================================
    limpiarPartidasExpiradas() {
        const expiradas = Object.entries(this.partidas)
            .filter(([, partida]) => partida && partida.estaExpirada())
            .map(([id]) => id);

        expiradas.forEach((id) => {
            this.io.to(id).emit("partida_expirada", { mensaje: "La partida ha expirado por falta de jugadores" });
            delete this.partidas[id];
        });

        return expiradas.length;
    }

    // ======================================================
    // NOMBRE: iniciarPartida
    // ENTRADA: id de partida + socket solicitante
    // SALIDA: countdown, game_started y estado inicial de juego
    // RESTRICCIONES: solo host y sala completa
    // OBJETIVO: arrancar lógica de juego en tiempo real
    // ======================================================
    iniciarPartida(partidaId, socket) {
        const partida = this.partidas[partidaId];
        if (!partida || !partida.puedeIniciar(socket.id)) {
            if (partida && partida.host === socket.id && partida.jugadores.length < partida.maxJugadores) {
                socket.emit("error_start", { mensaje: `Se necesitan ${partida.maxJugadores} jugadores para iniciar` });
            }
            return;
        }

        partida.estado = "countdown";

        let t = 3;
        const countdownInterval = setInterval(() => {
            this.io.to(partidaId).emit("countdown", Math.max(t, 0));

            if (t <= 0) {
                clearInterval(countdownInterval);
                partida.estado = "jugando";
                partida.marcarInicioJuego();

                // Inicializar LogicaJuego con galaxia, jugadores y bases iniciales
                const jugadoresData = partida.jugadores.map((j) => ({ socketId: j.id, nickname: j.nickname }));

                partida.gameLogic = new LogicaJuego(partida, {
                    intervaloProduccionMs: 20000,
                    porcentajeVictoria: partida.porcentajeVictoria || 0.6,
                    onPartidaFinalizada: (resumenFinal) => {
                        if (!resumenFinal) return;

                        historialPartidas.unshift({
                            partidaId: resumenFinal.partidaId,
                            galaxia: resumenFinal.galaxia,
                            tiempoJuego: resumenFinal.tiempoJuego,
                            ganador: resumenFinal.ganador,
                            tematica: resumenFinal.tematica || "clasica",
                            sistemasControlados: resumenFinal.sistemasControlados || 0,
                            recursosAcumulados: resumenFinal.recursosAcumulados || { minerales: 0, energia: 0, cristales: 0 },
                            tiempoFinalizacion: Date.now(),
                            motivo: resumenFinal.motivo,
                            motivoTexto: resumenFinal.motivoTexto,
                        });

                        if (historialPartidas.length > 100) {
                            historialPartidas.pop();
                        }

                        guardarHistorialPartidas(historialPartidas);
                    },
                });
                partida.gameLogic.inicializar(jugadoresData);
                partida.gameLogic.iniciarProduccion();
                partida.gameLogic.iniciarControlTiempoPartida();

                const estadoInicial = partida.gameLogic.obtenerEstadoPartida();
                this.io.to(partidaId).emit("game_started", {
                    partida: this.serializarPartida(partida),
                    estadoJuego: estadoInicial,
                    countdownFinalizado: true,
                });
                this.io.to(partidaId).emit("game_state_update", estadoInicial);
                return;
            }

            t--;
        }, 1000);
    }

    // ======================================================
    // NOMBRE: configurarSockets
    // ENTRADA: instancia socket.io en this.io
    // SALIDA: listeners registrados para toda la sesión
    // RESTRICCIONES: mantener eventos compatibles con frontend
    // OBJETIVO: coordinar acciones en tiempo real entre jugadores
    // ======================================================
    configurarSockets() {
        this.io.on("connection", (socket) => {
            console.log("Jugador conectado:", socket.id);

            socket.on("create_game", (configuracionPartida) => this.crearPartida(configuracionPartida, socket));

            socket.on("get_available_games", () => {
                socket.emit("available_games", this.obtenerPartidasDisponibles());
            });

            socket.on("join_game", (datosUnion) => this.unirPartida(datosUnion, socket));

            socket.on("start_game", (partidaId) => this.iniciarPartida(partidaId, socket));

            socket.on("construir", (datosConstruccion) => {
                const { partidaId, sistemaId, tipoEdificio } = datosConstruccion;
                const partida = this.partidas[partidaId];
                if (!partida || !partida.gameLogic) return;

                const resultado = partida.gameLogic.construir(socket.id, sistemaId, tipoEdificio);
                socket.emit("construir_resultado", resultado);

                const estadoActualizado = partida.gameLogic.obtenerEstadoPartida();
                this.io.to(partidaId).emit("game_state_update", estadoActualizado);
            });

            socket.on("enviar_flotas", (datosEnvioFlotas) => {
                const { partidaId, origen, destino, cantidad } = datosEnvioFlotas;
                const partida = this.partidas[partidaId];
                if (!partida || !partida.gameLogic) return;

                const resultado = partida.gameLogic.enviarFlotas(socket.id, origen, destino, cantidad);
                socket.emit("flotas_resultado", resultado);

                const estadoActualizado = partida.gameLogic.obtenerEstadoPartida();
                this.io.to(partidaId).emit("game_state_update", estadoActualizado);

                // Refresco de seguridad para clientes con latencia o desorden de eventos
                setTimeout(() => {
                    if (!this.partidas[partidaId]?.gameLogic) return;
                    this.io.to(partidaId).emit("game_state_update", this.partidas[partidaId].gameLogic.obtenerEstadoPartida());
                }, 250);
            });

            socket.on("presionar_tecla_u", ({ partidaId, nickname }) => {
                const partida = this.partidas[partidaId];
                if (!partida || !partida.gameLogic) return;

                const resultado = partida.gameLogic.iniciarConTeclaU(socket.id, nickname);
                socket.emit("inicio_u_resultado", resultado);

                if (resultado?.exito) {
                    this.io.to(partidaId).emit("game_state_update", partida.gameLogic.obtenerEstadoPartida());
                }
            });

            socket.on("atacar", (datosAtaque) => {
                const { partidaId, origen, destino, cantidad } = datosAtaque;
                const partida = this.partidas[partidaId];
                if (!partida || !partida.gameLogic) return;

                const resultado = partida.gameLogic.atacar(socket.id, origen, destino, cantidad);
                socket.emit("ataque_resultado", resultado);

                // Solo emitir de inmediato cuando no hay combate pendiente.
                // Si hay combate, la resolución final y el refresh llegan luego.
                if (resultado?.exito && !resultado?.enCombate) {
                    const estadoActualizado = partida.gameLogic.obtenerEstadoPartida();
                    this.io.to(partidaId).emit("game_state_update", estadoActualizado);
                } else if (resultado?.exito && resultado?.enCombate) {
                    setTimeout(() => {
                        const estadoFinal = partida.gameLogic.obtenerEstadoPartida();
                        this.io.to(partidaId).emit("game_state_update", estadoFinal);
                    }, 500);
                }

                // Refresco extra para asegurar que el grafo siempre reciba el estado final
                setTimeout(() => {
                    if (!this.partidas[partidaId]?.gameLogic) return;
                    this.io.to(partidaId).emit("game_state_update", this.partidas[partidaId].gameLogic.obtenerEstadoPartida());
                }, 900);
            });

            socket.on("get_game_state", (partidaId) => {
                const partida = this.partidas[partidaId];
                if (!partida || !partida.gameLogic) return;
                socket.emit("game_state_update", partida.gameLogic.obtenerEstadoPartida());
            });

            socket.on("disconnect", () => {
                Object.values(this.partidas).forEach((partida) => {
                    if (!partida) return;

                    if (partida.estado === "jugando" && partida.gameLogic) {
                        const jugadorDesconectado = partida.jugadores.find((jugador) => jugador.id === socket.id);
                        if (jugadorDesconectado) {
                            jugadorDesconectado.desconectado = true;
                        }
                        return;
                    }

                    partida.jugadores = partida.jugadores.filter((jugador) => jugador.id !== socket.id);

                    // Si queda al menos un jugador, actualizar el lobby
                    if (partida.jugadores.length > 0) {
                        this.io.to(partida.id).emit("lobby_update", this.serializarPartida(partida));
                    } else {
                        // Si no quedan jugadores, eliminar la partida
                        delete this.partidas[partida.id];
                    }
                });
            });
        });
    }
}

new ServidorJuego(app, io);

// Inicio del servidor
const PORT = Number(process.env.PORT) || 3002;

server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        console.error(`El puerto ${PORT} ya está en uso. Cierra el proceso que lo ocupa o inicia el backend con otro PORT.`);
        process.exit(1);
    }

    throw error;
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor multiplayer listo en puerto ${PORT}`);
});
