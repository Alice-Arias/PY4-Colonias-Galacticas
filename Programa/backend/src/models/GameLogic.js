// ======================================================
// NOMBRE: LogicaJuego (GameLogic)
// ENTRADA: datos de la partida y opciones de configuración
// SALIDA: estado actualizado del juego, eventos en tiempo real
// OBJETIVO: orquestar todos los gestores y exponer la API de juego al servidor
// ======================================================

const GestorSistemas     = require("../logic/Sistemas");
const GestorConstrucciones = require("../logic/Construcciones");
const GestorFlotas       = require("../logic/Flotas");
const GestorCombates     = require("../logic/Combates");
const GestorProduccion   = require("../logic/GestorProduccion");
const VerVictoria        = require("../logic/VerVictoria");

class LogicaJuego {
    constructor(partida, options = {}) {
        this.partida = partida;
        this.estado = "jugando";
        this.eventos = [];
        this.onPartidaFinalizada = options.onPartidaFinalizada || null;
        this.inicioHabilitado = false;
        this.inicioEnProceso = false;
        this.intervaloCuentaRegresivaInicio = null;
        this.intervaloFinPartida = null;

        // Mapas compartidos
        this.jugadores = new Map();
        this.sistemas  = new Map();
        this.rutas     = new Map();

        const intervaloMs      = options.intervaloProduccionMs ?? 20000;
        const porcentajeVictoria = options.porcentajeVictoria ?? 0.6;

        // Instancia gestores
        this.gestorSistemas      = new GestorSistemas(this.sistemas, this.rutas);
        this.gestorConstrucciones = new GestorConstrucciones(this.sistemas, this.jugadores);
        this.gestorFlotas        = new GestorFlotas(this.sistemas, this.rutas, this.jugadores);
        this.gestorCombates      = new GestorCombates(this.sistemas, this.jugadores, partida);
        this.gestorProduccion    = new GestorProduccion(this.sistemas, this.jugadores, partida, intervaloMs);
        this.gestorVictoria      = new VerVictoria(this.sistemas, this.jugadores, partida, porcentajeVictoria);

        // Conectar callbacks entre gestores
        this._conectarCallbacks();
    }

    // ======================================================
    // NOMBRE: _conectarCallbacks
    // ENTRADA: sin entrada 
    // SALIDA: callbacks asignados entre gestores
    // RESTRICCIONES: llamar solo una vez en el constructor
    // OBJETIVO: conectar los gestores sin crear dependencias circulares
    // ======================================================
    _conectarCallbacks() {
        // Combates notifica cuando termina una batalla
        this.gestorCombates.onBatallaResuelta = () => {
            this._emitirEstado();
            this.gestorVictoria.evaluarVictoria();
        };

        // Produccion notifica cuando aplica un ciclo
        this.gestorProduccion.onProduccionAplicada = () => {
            this._emitirEstado();
            this.gestorVictoria.evaluarVictoria();
        };

        // Victoria notifica cuando la partida termina
        this.gestorVictoria.onPartidaFinalizada = (resumenFinal) => {
            this.estado = "finalizada";
            this.gestorProduccion.detener();
            if (this.intervaloCuentaRegresivaInicio) {
                clearInterval(this.intervaloCuentaRegresivaInicio);
            }
            if (this.intervaloFinPartida) {
                clearInterval(this.intervaloFinPartida);
                this.intervaloFinPartida = null;
            }

            if (this.onPartidaFinalizada) {
                this.onPartidaFinalizada(resumenFinal);
            }
        };

        // Victoria obtiene el log de eventos para el game_over
        this.gestorVictoria.onObtenerEventos = () => this.eventos;

        // Combates y Produccion registran eventos en el log central
        this.gestorCombates.onRegistrarEvento = (tipo, payload) => {
            this._registrarEvento(tipo, payload);
        };

        this.gestorProduccion.onRegistrarEvento = (tipo, payload) => {
            this._registrarEvento(tipo, payload);
        };
    }

    // ======================================================
    // NOMBRE: inicializar
    // ENTRADA: lista de jugadores con socketId y nickname
    // SALIDA: mapas internos de sistemas, rutas y jugadores listos
    // RESTRICCIONES: galaxia y jugadores válidos en la partida
    // OBJETIVO: preparar todo el estado inicial del juego
    // ======================================================
    inicializar(jugadoresData) {
        this.gestorSistemas.cargarSistemas(this.partida.galaxia);
        this.gestorSistemas.cargarRutas(this.partida.galaxia);
        this._inicializarJugadores(jugadoresData);
        this._asignarSistemasIniciales();
    }

    // ======================================================
    // NOMBRE: _inicializarJugadores
    // ENTRADA: arreglo de objetos { socketId, nickname }
    // SALIDA: mapa de jugadores inicializado con recursos base
    // RESTRICCIONES: recursos iniciales según configuración de la partida
    // OBJETIVO: crear el estado inicial de cada jugador
    // ======================================================
    _inicializarJugadores(jugadoresData) {
        this.jugadores.clear();

        const recursosIniciales = {
            minerales: Number(this.partida?.recursosIniciales?.minerales) || 300,
            energia: Number(this.partida?.recursosIniciales?.energia) || 150,
            cristales: Number(this.partida?.recursosIniciales?.cristales) || 50,
        };

        jugadoresData.forEach((jugador) => {
            this.jugadores.set(jugador.socketId, {
                socketId: jugador.socketId,
                nickname: jugador.nickname,
                sistemaInicialId: null,
                recursos: { ...recursosIniciales },
                sistemas: new Set(),
                sistemasControlados: 0,
                eliminado: false,
            });
        });
    }

    // ======================================================
    // NOMBRE: _asignarSistemasIniciales
    // ENTRADA: sin entrada explícita (usa jugadores y sistemas cargados)
    // SALIDA: cada jugador con un sistema base asignado
    // RESTRICCIONES: sistemas deben estar cargados antes de llamar este método
    // OBJETIVO: dar a cada jugador su planeta inicial separado
    // ======================================================
    _asignarSistemasIniciales() {
        const jugadores = Array.from(this.jugadores.values());
        const sistemas  = Array.from(this.sistemas.values());

        // Mezcla aleatoria para que cada partida asigne bases distintas
        // sin repetir nodos entre jugadores.
        for (let i = sistemas.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [sistemas[i], sistemas[j]] = [sistemas[j], sistemas[i]];
        }

        const seleccionados = [];
        const usados = new Set();

        // Preferir bases que no sean vecinas directas entre sí.
        for (const candidato of sistemas) {
            if (seleccionados.length >= jugadores.length) break;
            const esVecinoDeSeleccionado = seleccionados.some((base) => {
                const vecinosCandidato = this.rutas.get(candidato.id);
                const vecinosBase = this.rutas.get(base.id);
                return Boolean(
                    vecinosCandidato?.has(base.id) || vecinosBase?.has(candidato.id)
                );
            });

            if (esVecinoDeSeleccionado) continue;
            seleccionados.push(candidato);
            usados.add(candidato.id);
        }

        // Fallback: si no hay suficientes no-vecinos (mapa denso), completar sin repetir.
        if (seleccionados.length < jugadores.length) {
            for (const candidato of sistemas) {
                if (seleccionados.length >= jugadores.length) break;
                if (usados.has(candidato.id)) continue;
                seleccionados.push(candidato);
                usados.add(candidato.id);
            }
        }

        jugadores.forEach((jugador, index) => {
            const sistemaBase = seleccionados[index];
            if (!sistemaBase) return;

            jugador.sistemaInicialId = sistemaBase.id;
            this.gestorCombates.conquistarSistema(jugador.socketId, sistemaBase.id, {
                inicial: true,
                flotasRestantes: 8,
            });
        });
    }

    // ======================================================
    // NOMBRE: iniciarProduccion
    // ENTRADA: sin entrada explícita
    // SALIDA: temporizador de producción activo
    // RESTRICCIONES: llamar después de inicializar()
    // OBJETIVO: arrancar el ciclo de producción de recursos
    // ======================================================
    iniciarProduccion() {
        this.gestorProduccion.iniciarProduccion();
    }

    // ======================================================
    // NOMBRE: iniciarControlTiempoPartida
    // ENTRADA: sin entrada explícita
    // SALIDA: intervalo que finaliza la partida cuando se agota el tiempo
    // RESTRICCIONES: llamar una vez por partida activa
    // OBJETIVO: cerrar automáticamente la partida al llegar a cero
    // ======================================================
    iniciarControlTiempoPartida() {
        if (this.intervaloFinPartida) {
            clearInterval(this.intervaloFinPartida);
        }

        this.intervaloFinPartida = setInterval(() => {
            if (!this.partida?.estaFinalizadaPorTiempo?.()) return;
            this.gestorVictoria.finalizarPorTiempo();
            this.detener();
        }, 1000);
    }

    // ======================================================
    // NOMBRE: iniciarConTeclaU
    // ENTRADA: socketId del jugador que presiona U
    // SALIDA: objeto { exito, mensaje } + countdown emitido a todos
    // RESTRICCIONES: solo una vez por partida, partida no finalizada
    // OBJETIVO: habilitar el inicio real del juego con cuenta regresiva
    // ======================================================
    iniciarConTeclaU(socketId, nickname = "") {
        if (this.estado === "finalizada") {
            return { exito: false, mensaje: "La partida ya finalizó" };
        }

        let jugador = this.jugadores.get(socketId);

        // Fallback: si el socket cambió (reconexión), intentar identificar por nickname.
        if (!jugador && nickname) {
            const normalizado = String(nickname).trim().toLowerCase();
            for (const [socketAnterior, candidato] of this.jugadores.entries()) {
                if (String(candidato?.nickname || "").trim().toLowerCase() !== normalizado) continue;
                jugador = candidato;
                if (socketAnterior !== socketId) {
                    this.jugadores.delete(socketAnterior);
                    jugador.socketId = socketId;
                    this.jugadores.set(socketId, jugador);
                }
                break;
            }
        }

        if (!jugador) {
            return { exito: false, mensaje: "Jugador no encontrado" };
        }

        if (this.inicioHabilitado) {
            return { exito: false, mensaje: "La partida ya está iniciada" };
        }

        if (this.inicioEnProceso) {
            return { exito: false, mensaje: "La cuenta regresiva ya está en curso" };
        }

        this.inicioEnProceso = true;
        let segundosRestantes = 3;

        if (global.io && this.partida?.id) {
            global.io.to(this.partida.id).emit("countdown_inicio_u", {
                segundosRestantes,
                jugador: jugador.nickname,
            });
        }

        this.intervaloCuentaRegresivaInicio = setInterval(() => {
            segundosRestantes -= 1;

            if (segundosRestantes <= 0) {
                clearInterval(this.intervaloCuentaRegresivaInicio);
                this.intervaloCuentaRegresivaInicio = null;
                this.inicioHabilitado = true;
                this.inicioEnProceso  = false;

                // Sincronizar el flag con GestorProduccion
                this.gestorProduccion.inicioHabilitado = true;

                this._registrarEvento("system", {
                    jugador: "Sistema",
                    mensaje: `Inicio habilitado por ${jugador.nickname}. ¡La partida está activa!`,
                    color: "#f6d365",
                });

                if (global.io && this.partida?.id) {
                    global.io.to(this.partida.id).emit("inicio_u_completado", {
                        mensaje: "La partida está en marcha",
                    });
                }

                this._emitirEstado();
                this.gestorProduccion._emitirTimer();
                return;
            }

            if (global.io && this.partida?.id) {
                global.io.to(this.partida.id).emit("countdown_inicio_u", {
                    segundosRestantes,
                    jugador: jugador.nickname,
                });
            }
        }, 1000);

        return { exito: true, mensaje: `Cuenta regresiva iniciada por ${jugador.nickname}` };
    }

    // ======================================================
    // NOMBRE: construir
    // ENTRADA: socketId del jugador, sistemaId destino, tipoEdificio
    // SALIDA: resultado de éxito/error + estado actualizado emitido
    // RESTRICCIONES: sistema propio, recursos suficientes, sin ataque activo
    // OBJETIVO: delegar construcción al GestorConstrucciones
    // ======================================================
    construir(socketId, sistemaId, tipoEdificio) {
        const resultado = this.gestorConstrucciones.construir(
            socketId,
            sistemaId,
            tipoEdificio,
            this.inicioHabilitado
        );

        if (resultado.exito) {
            const jugador = this.jugadores.get(socketId);
            const sistema = this.sistemas.get(sistemaId);
            this._registrarEvento("build", {
                jugador: jugador?.nickname || socketId,
                mensaje: `construyó ${tipoEdificio} en ${sistema?.nombre || sistemaId}`,
                color: "#00ff88",
            });
            this._emitirEstado();
            this.gestorVictoria.evaluarVictoria();
        }

        return resultado;
    }

    // ======================================================
    // NOMBRE: enviarFlotas
    // ENTRADA: socketId, origenId, destinoId, cantidad
    // SALIDA: resultado del movimiento, conquista o combate
    // RESTRICCIONES: ruta válida, flotas disponibles, costo pagable
    // OBJETIVO: delegar movimiento de flotas al GestorFlotas
    // ======================================================
    enviarFlotas(socketId, origenId, destinoId, cantidad) {
        const resultado = this.gestorFlotas.enviarFlotas(
            socketId,
            origenId,
            destinoId,
            cantidad,
            this.inicioHabilitado,
            this.gestorCombates
        );

        if (resultado.exito && resultado.conquistado) {
            const jugador = this.jugadores.get(socketId);
            const destino = this.sistemas.get(destinoId);
            this._registrarEvento("owner_change", {
                jugador: jugador?.nickname || socketId,
                mensaje: `tomó el control de ${destino?.nombre || destinoId}`,
                color: "#ff6b6b",
            });
            this._registrarEvento("conquest", {
                jugador: jugador?.nickname || socketId,
                mensaje: `conquistó ${destino?.nombre || destinoId} sin resistencia`,
                color: "#00ff88",
            });
            this._emitirEstado();
            this.gestorVictoria.evaluarVictoria();
        } else if (resultado.exito && !resultado.enCombate) {
            const jugador = this.jugadores.get(socketId);
            const origen  = this.sistemas.get(origenId);
            const destino = this.sistemas.get(destinoId);
            this._registrarEvento("fleet", {
                jugador: jugador?.nickname || socketId,
                mensaje: `envió ${cantidad} flotas de ${origen?.nombre || origenId} a ${destino?.nombre || destinoId}`,
                color: "#00aaff",
            });
            this._emitirEstado();
            this.gestorVictoria.evaluarVictoria();
        }

        return resultado;
    }

    // ======================================================
    // NOMBRE: atacar
    // ENTRADA: socketId atacante, origenId, destinoId
    // SALIDA: resultado del ataque iniciado
    // RESTRICCIONES: sistema origen propio, sistema destino enemigo
    // OBJETIVO: iniciar un ataque directo con la cantidad de flotas indicada
    // ======================================================
    atacar(socketId, origenId, destinoId, cantidad) {
        const origen = this.sistemas.get(origenId);
        if (!origen) return { exito: false, mensaje: "Sistema origen no encontrado" };

        const flotasSolicitadas = Math.floor(Number(cantidad) || 0) || (origen.flotas || 0);
        if (flotasSolicitadas <= 0) return { exito: false, mensaje: "No tienes flotas en ese sistema" };

        return this.gestorFlotas.enviarFlotas(
            socketId,
            origenId,
            destinoId,
            flotasSolicitadas,
            this.inicioHabilitado,
            this.gestorCombates,
            true
        );
    }

    // ======================================================
    // NOMBRE: reasignarSocketJugador
    // ENTRADA: socketId anterior, socketId nuevo, nickname del jugador
    // SALIDA: booleano indicando si la reasignación fue exitosa
    // RESTRICCIONES: el jugador debe existir por socketId o nickname
    // OBJETIVO: mantener al jugador en la partida si se reconecta
    // ======================================================
    reasignarSocketJugador(oldSocketId, newSocketId, nickname) {
        if (!newSocketId) return false;

        let jugador = this.jugadores.get(oldSocketId);
        let sourceSocketId = oldSocketId;

        if (!jugador && nickname) {
            const encontrado = Array.from(this.jugadores.values()).find(
                (item) => item.nickname === nickname
            );
            if (!encontrado) return false;
            jugador = encontrado;
            sourceSocketId = encontrado.socketId;
        }

        if (!jugador) return false;
        if (sourceSocketId === newSocketId) return true;

        this.jugadores.delete(sourceSocketId);
        jugador.socketId = newSocketId;
        this.jugadores.set(newSocketId, jugador);

        // Actualizar propietarioId en sistemas que pertenecían al socket anterior
        this.sistemas.forEach((sistema) => {
            if (sistema.propietarioId === sourceSocketId) {
                sistema.propietarioId = newSocketId;
            }
            if (sistema.baseInicialDe === sourceSocketId) {
                sistema.baseInicialDe = newSocketId;
            }
        });

        return true;
    }

    // ======================================================
    // NOMBRE: obtenerEstadoPartida
    // ENTRADA: sin entrada explícita (usa estado interno)
    // SALIDA: snapshot serializable para el frontend
    // RESTRICCIONES: incluir solo datos necesarios de gameplay
    // OBJETIVO: sincronizar clientes en tiempo real
    // ======================================================
    obtenerEstadoPartida() {
        // Reconciliar ownership real antes de serializar para evitar desfaces
        // entre jugador.sistemas y la propiedad efectiva de los nodos.
        this._reconciliarControlJugadores();

        const sistemas = Array.from(this.sistemas.values()).map((sistema) => ({
            ...sistema,
            controladoPor: sistema.propietario,
        }));

        const jugadores = Array.from(this.jugadores.values()).map((jugador) => ({
            socketId: jugador.socketId,
            nickname: jugador.nickname,
            sistemaInicialId: jugador.sistemaInicialId,
            recursos: { ...jugador.recursos },
            sistemasControlados: jugador.sistemas.size,
            sistemas: Array.from(jugador.sistemas),
            flotasEnPie: this._calcularFlotasJugador(jugador.socketId),
            puntaje: this.gestorVictoria._calcularPuntaje(jugador),
            eliminado: jugador.eliminado,
        }));

        return {
            id: this.partida.id,
            nombre: this.partida.nombre,
            tematica: this.partida.tematica,
            porcentajeVictoria: Math.round((this.partida?.porcentajeVictoria || 0.6) * 100),
            galaxia: {
                nombre: this.partida.galaxia?.nombre,
                sistemas,
                rutas: this.partida.galaxia?.rutas || [],
            },
            tiempoProduccionRestante: this.gestorProduccion.tiempoRestante,
            intervaloProduccionMs: this.gestorProduccion.intervaloMs,
            tiempoPartidaRestante: this.partida.obtenerTiempoJuegoRestante?.(),
            inicioHabilitado: this.inicioHabilitado,
            inicioEnProceso: this.inicioEnProceso,
            jugadores,
            eventos: this.eventos,
            ganador: this.gestorVictoria.ganador,
            estado: this.estado,
        };
    }

    // ======================================================
    // NOMBRE: _registrarEvento
    // ENTRADA: tipo de evento y payload con detalles
    // SALIDA: evento agregado al log interno
    // RESTRICCIONES: mantener máximo 25 eventos en el log
    // OBJETIVO: mantener historial de eventos para el frontend
    // ======================================================
    _registrarEvento(tipo, payload) {
        if (tipo === "production") {
            return null;
        }

        const evento = {
            tipo,
            hora: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
            ...payload,
        };

        this.eventos.unshift(evento);
        this.eventos = this.eventos.slice(0, 25);
        return evento;
    }

    // ======================================================
    // NOMBRE: _emitirEstado
    // ENTRADA: sin entrada explícita
    // SALIDA: evento game_state_update emitido a todos los clientes
    // RESTRICCIONES: requiere global.io y partida válida
    // OBJETIVO: sincronizar estado del juego en tiempo real
    // ======================================================
    _emitirEstado() {
        if (!global.io || !this.partida?.id) return;
        global.io.to(this.partida.id).emit("game_state_update", this.obtenerEstadoPartida());
    }

    // ======================================================
    // NOMBRE: _calcularFlotasJugador
    // ENTRADA: socketId del jugador
    // SALIDA: total de flotas activas en todos sus sistemas
    // RESTRICCIONES: ninguna
    // OBJETIVO: calcular flotas para el snapshot de estado
    // ======================================================
    _calcularFlotasJugador(socketId) {
        return Array.from(this.sistemas.values())
            .filter((sistema) => sistema.propietarioId === socketId)
            .reduce((total, sistema) => total + (sistema.flotas || 0), 0);
    }

    // ======================================================
    // NOMBRE: _reconciliarControlJugadores
    // ENTRADA: sin entrada explícita
    // SALIDA: sincroniza jugador.sistemas y sistemasControlados con el ownership real
    // RESTRICCIONES: ninguna
    // OBJETIVO: evitar que el frontend reciba contadores de control desactualizados
    // ======================================================
    _reconciliarControlJugadores() {
        const sistemasPorJugador = new Map();

        for (const sistema of this.sistemas.values()) {
            if (!sistema?.propietarioId) continue;
            if (!sistemasPorJugador.has(sistema.propietarioId)) {
                sistemasPorJugador.set(sistema.propietarioId, []);
            }
            sistemasPorJugador.get(sistema.propietarioId).push(sistema.id);
        }

        for (const jugador of this.jugadores.values()) {
            const ids = sistemasPorJugador.get(jugador.socketId) || [];
            jugador.sistemas = new Set(ids);
            jugador.sistemasControlados = jugador.sistemas.size;
        }
    }

    // ======================================================
    // NOMBRE: detener
    // ENTRADA: sin entrada
    // SALIDA: todos los intervalos detenidos
    // RESTRICCIONES: ninguna
    // OBJETIVO: limpiar recursos al cerrar la partida
    // ======================================================
    detener() {
        this.gestorProduccion.detener();
        if (this.intervaloCuentaRegresivaInicio) {
            clearInterval(this.intervaloCuentaRegresivaInicio);
            this.intervaloCuentaRegresivaInicio = null;
        }
        if (this.intervaloFinPartida) {
            clearInterval(this.intervaloFinPartida);
            this.intervaloFinPartida = null;
        }
    }
}

module.exports = LogicaJuego;