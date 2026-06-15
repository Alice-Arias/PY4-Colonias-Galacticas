// Servidor principal multijugador (Socket + Express)

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const { Partida, crearUniverso, listarGalaxias } = require("./game/universo");
const LogicaJuego = require("./src/models/GameLogic");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, { cors: { origin: "*" } });
global.io = io;

// Almacenamiento de partidas en memoria
const partidasEnMemoria = {};

class ServidorJuego {
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

        const partida = new Partida({
            id,
            nombre: configuracionPartida.nombre,
            maxJugadores: configuracionPartida.maxJugadores,
            host: socket.id,
            galaxia,
            tiempoEspera: configuracionPartida.tiempoEspera || 300,
        });

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
    // RESTRICCIONES: solo host y mínimo 2 jugadores
    // OBJETIVO: arrancar lógica de juego en tiempo real
    // ======================================================
    iniciarPartida(partidaId, socket) {
        const partida = this.partidas[partidaId];
        if (!partida || !partida.puedeIniciar(socket.id)) {
            if (partida && partida.host === socket.id && partida.jugadores.length < 2) {
                socket.emit("error_start", { mensaje: "Se necesitan mínimo 2 jugadores" });
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

                // Inicializar LogicaJuego con galaxia, jugadores y bases iniciales
                const jugadoresData = partida.jugadores.map((j) => ({ socketId: j.id, nickname: j.nickname }));

                partida.gameLogic = new LogicaJuego(partida, {
                    intervaloProduccionMs: 20000,
                    porcentajeVictoria: 0.6,
                });
                partida.gameLogic.inicializar(jugadoresData);
                partida.gameLogic.iniciarProduccion();

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
            });

            socket.on("presionar_tecla_u", ({ partidaId }) => {
                const partida = this.partidas[partidaId];
                if (!partida || !partida.gameLogic) return;

                const resultado = partida.gameLogic.iniciarConTeclaU(socket.id);
                socket.emit("inicio_u_resultado", resultado);

                if (resultado?.exito) {
                    this.io.to(partidaId).emit("game_state_update", partida.gameLogic.obtenerEstadoPartida());
                }
            });

            socket.on("atacar", (datosAtaque) => {
                const { partidaId, origen, destino } = datosAtaque;
                const partida = this.partidas[partidaId];
                if (!partida || !partida.gameLogic) return;

                const resultado = partida.gameLogic.atacar(socket.id, origen, destino);
                socket.emit("ataque_resultado", resultado);

                const estadoActualizado = partida.gameLogic.obtenerEstadoPartida();
                this.io.to(partidaId).emit("game_state_update", estadoActualizado);
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
server.listen(3002, "0.0.0.0", () => {
    console.log("Servidor multiplayer listo en puerto 3002");
});
