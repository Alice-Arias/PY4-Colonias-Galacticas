// ======================================================
// NOMBRE: useJuego
// ENTRADA: partidaId y playerName
// SALIDA: estado completo del juego y funciones de acción
// RESTRICCIONES: requiere partidaId válido para conectarse
// OBJETIVO: centralizar todo el estado y lógica del componente Juego
// ======================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { useSocket } from "./useSocket";
import {
    transformarEstadoServidor,
    getPlayerState,
    inferSelectedDetails,
} from "../utils/transformadores";
import { getCostoConstruccion } from "../utils/construccion";
import { calcularCostoMovimiento } from "../utils/flotas";

export function useJuego(partidaId, playerName) {
    const [estadoServidor, setEstadoServidor]         = useState(null);
    const [estado, setEstado]                         = useState("conectando");
    const [mensajeInicio, setMensajeInicio]           = useState("Conectando a la partida...");
    const [countdown, setCountdown]                   = useState(null);
    const [inicioPartida, setInicioPartida]           = useState(null);
    const [partidaTimer, setPartidaTimer]             = useState(0);
    const [seleccionado, setSeleccionado]             = useState(null);
    const [modalConstruir, setModalConstruir]         = useState(false);
    const [modalFlota, setModalFlota]                 = useState(false);
    const [modalDetalles, setModalDetalles]           = useState(false);
    const [modalBatalla, setModalBatalla]             = useState(false);
    const [eventoBatalla, setEventoBatalla]           = useState(null);
    const [sistemas, setSistemas]                     = useState([]);
    const [eventos, setEventos]                       = useState([]);
    const [playerSocketId, setPlayerSocketId]         = useState(null);
    const [produccionTimer, setProduccionTimer]       = useState(20);
    const [ganador, setGanador]                       = useState(null);
    const [alertaAtaque, setAlertaAtaque]             = useState("");
    const [resumenPartida, setResumenPartida]         = useState(null);
    const [formConstruccion, setFormConstruccion]     = useState("mina");
    const [formFlota, setFormFlota]                   = useState({ destino: "", cantidad: 1 });
    const [inicioHabilitado, setInicioHabilitado]     = useState(false);
    const [countdownInicioU, setCountdownInicioU]     = useState(null);
    const [ultimoSync, setUltimoSync]                 = useState(null);
    const [movimientoVisual, setMovimientoVisual]     = useState(null);
    const [jugadorSnapshot, setJugadorSnapshot]       = useState(null);
    const [ordenFlotaPendiente, setOrdenFlotaPendiente] = useState(false);
    const puntajePrevioRef = useRef(null);
    const accionFlotaPendienteRef = useRef(null);
    const ordenFlotaTimeoutRef = useRef(null);
    const ordenFlotaEnviadaAtRef = useRef(null);

    const marcarSync = () => setUltimoSync(Date.now());

    const agregarEventoLocal = (evento) => {
        if (!evento) return;
        setEventos((prev) => [evento, ...(prev || [])].slice(0, 25));
    };

    const aplicarEstadoOptimista = (mutador) => {
        let siguienteEstado = null;

        setEstadoServidor((prev) => {
            if (!prev) return prev;
            const clonado = JSON.parse(JSON.stringify(prev));
            mutador(clonado);
            siguienteEstado = clonado;
            return clonado;
        });

        if (siguienteEstado) {
            setSistemas(transformarEstadoServidor(siguienteEstado));
        }
    };

    // ======================================================
    // NOMBRE: callbacks de socket
    // ENTRADA: payloads del servidor
    // SALIDA: actualizaciones de estado del juego
    // RESTRICCIONES: cada callback maneja un evento específico
    // OBJETIVO: separar el manejo de cada evento del servidor
    // ======================================================
    const onGameStarted = (payload) => {
        marcarSync();
        setEstado("activo");
        setMensajeInicio("Partida cargada. Presiona U para iniciar");
        setInicioPartida((prev) => prev ?? Date.now());
        if (payload?.estadoJuego) {
            setEstadoServidor(payload.estadoJuego);
            setSistemas(transformarEstadoServidor(payload.estadoJuego));
            setEventos(payload.estadoJuego.eventos || []);
            setProduccionTimer(Math.max(0, Math.floor(payload.estadoJuego.tiempoProduccionRestante ?? 20)));
            setInicioHabilitado(Boolean(payload.estadoJuego.inicioHabilitado));
        }
    };

    const onGameState = (payload) => {
        marcarSync();
        setEstado((prev) => (prev === "finalizada" ? prev : "activo"));
        setEstadoServidor(payload);
        setSistemas(transformarEstadoServidor(payload));
        setEventos(payload.eventos || []);
        if (typeof payload.tiempoProduccionRestante === "number") {
            setProduccionTimer(payload.tiempoProduccionRestante);
        }
        setInicioHabilitado(Boolean(payload.inicioHabilitado));
        if (payload.ganador) setGanador(payload.ganador);

        // Si hubo una orden enviada y llega un estado nuevo del servidor,
        // liberamos la espera para evitar falsos "sin confirmación".
        if (ordenFlotaPendiente && ordenFlotaEnviadaAtRef.current) {
            const elapsed = Date.now() - ordenFlotaEnviadaAtRef.current;
            if (elapsed > 250) {
                setOrdenFlotaPendiente(false);
                if (ordenFlotaTimeoutRef.current) {
                    clearTimeout(ordenFlotaTimeoutRef.current);
                    ordenFlotaTimeoutRef.current = null;
                }
            }
        }

        const jugadorEnEstado = getPlayerState(payload, playerName, playerSocketId);
        setJugadorSnapshot(jugadorEnEstado || null);
        const puntajeActual = Number(jugadorEnEstado?.puntaje || 0);

        if (puntajePrevioRef.current === null) {
            puntajePrevioRef.current = puntajeActual;
            return;
        }

        const deltaPuntaje = puntajeActual - puntajePrevioRef.current;
        if (deltaPuntaje !== 0) {
            const signo = deltaPuntaje > 0 ? "+" : "";
            setAlertaAtaque(`Puntaje ${signo}${deltaPuntaje} (total ${puntajeActual})`);

            setEventos((prev) => [
                {
                    tipo: "score",
                    hora: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
                    jugador: jugadorEnEstado?.nickname || playerName,
                    mensaje: `puntaje ${signo}${deltaPuntaje} (total ${puntajeActual})`,
                    color: deltaPuntaje > 0 ? "#00ff88" : "#ff6b6b",
                },
                ...(prev || []),
            ].slice(0, 25));
        }

        puntajePrevioRef.current = puntajeActual;
    };

    const onCountdown = (segundos) => {
        marcarSync();
        setCountdown(segundos);
        setMensajeInicio(`La conquista empieza en ${segundos}`);
        setEstado("countdown");
    };

    const onProductionTimer = (segundosRestantes) => {
        marcarSync();
        setProduccionTimer(segundosRestantes);
    };

    const onCountdownInicioU = (segundosRestantes) => {
        marcarSync();
        setCountdownInicioU(segundosRestantes);
        setAlertaAtaque(`Inicio en ${segundosRestantes}s...`);
    };

    const onInicioUCompletado = () => {
        marcarSync();
        setCountdownInicioU(null);
        setInicioHabilitado(true);
        setAlertaAtaque("Partida activa: ya puedes construir, mover flotas y generar recursos.");
    };

    const onInicioUResultado = (resultado) => {
        if (!resultado?.exito) {
            setAlertaAtaque(resultado?.mensaje || "No se pudo iniciar con tecla U.");
        }
    };

    const onBattleStart = (data) => {
        marcarSync();
        if (!data) {
            setModalBatalla(false);
            return;
        }
        setEventoBatalla({ tipo: "inicio", ...data });
        setModalBatalla(true);
        if (data?.defensorId === playerSocketId || data?.defensor === playerName) {
            setAlertaAtaque(`Ataque entrante en ${data.sistemaNombre}: ${data.flotasAtacantes} flotas enemigas.`);
        }
    };

    const onBattleResult = (data) => {
        marcarSync();
        setEventoBatalla({ tipo: "resultado", ...data });
        setModalBatalla(true);

        if (data?.planetaConquistado) {
            setAlertaAtaque(`Conquistado: ${data?.sistemaNombre || "sistema"}`);
        } else if (data?.ataqueGana === false) {
            setAlertaAtaque(`Defensa exitosa en ${data?.sistemaNombre || "el sistema"}`);
        }

        if (data?.ganador) {
            setEventos((prev) => [
                {
                    hora: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
                    jugador: data.ganador,
                    mensaje: `ganó la batalla en ${data.sistemaNombre}`,
                    tipo: data.ataqueGana ? "battle" : "eliminated",
                    color: data.ataqueGana ? "#00ff88" : "#ff4444",
                },
                ...(data?.planetaConquistado ? [{
                    hora: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
                    jugador: data.ganador,
                    mensaje: `conquistó ${data.sistemaNombre}`,
                    tipo: "conquest",
                    color: "#00ff88",
                }] : []),
                ...prev,
            ]);
        }
    };

    const onGameOver = (data) => {
        marcarSync();
        setGanador(data.ganador);
        setResumenPartida(data);
        setEventos(data.eventos || []);
        setEstado("finalizada");

        if (data) {
            sessionStorage.setItem("ultimaPartidaResumen", JSON.stringify(data));
            localStorage.setItem("ultimaPartidaResumen", JSON.stringify(data));
        }
    };

    const onConstruirResultado = (resultado) => {
        marcarSync();
        if (resultado?.exito) {
            setAlertaAtaque(resultado?.mensaje || "Construcción realizada.");
            setModalConstruir(false);
            return;
        }

        setAlertaAtaque(resultado?.mensaje || "No se pudo construir en el sistema seleccionado.");
    };

    const onFlotasResultado = (resultado) => {
        marcarSync();
        ordenFlotaEnviadaAtRef.current = null;
        if (ordenFlotaTimeoutRef.current) {
            clearTimeout(ordenFlotaTimeoutRef.current);
            ordenFlotaTimeoutRef.current = null;
        }
        setOrdenFlotaPendiente(false);
        if (!resultado?.exito) {
            accionFlotaPendienteRef.current = null;
            setAlertaAtaque(resultado?.mensaje || "No se pudo enviar la flota.");
            return;
        }

        const pendiente = accionFlotaPendienteRef.current;
        if (pendiente?.origenId && pendiente?.destinoId) {
            setMovimientoVisual({
                origenId: pendiente.origenId,
                destinoId: pendiente.destinoId,
                tipo: pendiente.tipo || "movimiento",
                expiresAt: Date.now() + 1300,
            });

            agregarEventoLocal({
                tipo: pendiente.tipo === "ataque" ? "battle_start" : "fleet",
                hora: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
                jugador: playerStateNickname || playerName,
                mensaje: pendiente.tipo === "ataque"
                    ? `inició conquista desde ${pendiente.origenNombre} hacia ${pendiente.destinoNombre}`
                    : `envió ${pendiente.cantidad} flotas de ${pendiente.origenNombre} a ${pendiente.destinoNombre}`,
                color: pendiente.tipo === "ataque" ? "#ffa94d" : "#00aaff",
            });
        }
        accionFlotaPendienteRef.current = null;

        setModalFlota(false);
        if (resultado?.enCombate) {
            setAlertaAtaque(resultado?.mensaje || "Combate iniciado. Esperando resolución...");
        } else if (resultado?.conquistado) {
            setAlertaAtaque(`Conquistado: ${resultado?.mensaje || "sistema tomado"}`);
        } else {
            setAlertaAtaque(resultado?.mensaje || "Movimiento de flotas enviado.");
        }
    };

    const onAtaqueResultado = (resultado) => {
        marcarSync();
        ordenFlotaEnviadaAtRef.current = null;
        if (ordenFlotaTimeoutRef.current) {
            clearTimeout(ordenFlotaTimeoutRef.current);
            ordenFlotaTimeoutRef.current = null;
        }
        setOrdenFlotaPendiente(false);
        if (!resultado?.exito) {
            accionFlotaPendienteRef.current = null;
            setAlertaAtaque(resultado?.mensaje || "No se pudo iniciar la conquista.");
            return;
        }

        const pendiente = accionFlotaPendienteRef.current;
        if (pendiente?.origenId && pendiente?.destinoId) {
            setMovimientoVisual({
                origenId: pendiente.origenId,
                destinoId: pendiente.destinoId,
                tipo: "ataque",
                expiresAt: Date.now() + 1500,
            });

            agregarEventoLocal({
                tipo: "battle_start",
                hora: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
                jugador: playerStateNickname || playerName,
                mensaje: `inició conquista hacia ${pendiente.destinoNombre}`,
                color: "#ffa94d",
            });
        }
        accionFlotaPendienteRef.current = null;

        setModalFlota(false);
        setAlertaAtaque(resultado?.mensaje || "Conquista enviada. Esperando resolución del combate...");
        
        // FALLBACK: Si no llega battle_start desde el servidor,
        // el cliente detectará cambios de estado a través de game_state_update
        // y mostrará un modal de batalla con los datos actualizados
    };

    const onSistemaConquistado = (data) => {
        marcarSync();
        setAlertaAtaque(
            `Perdiste ${data?.sistemaNombre || "un sistema"}. ${data?.atacante || "Un enemigo"} lo conquistó.`
        );

        // Reflejar de inmediato el nuevo propietario en UI para evitar mostrar dueño anterior.
        aplicarEstadoOptimista((estado) => {
            const sistema = estado.galaxia?.sistemas?.find((item) => item.id === data?.sistemaId);
            const atacante = (estado.jugadores || []).find((item) => item.nickname === data?.atacante);

            if (sistema) {
                sistema.propietario = data?.atacante || sistema.propietario;
                if (atacante?.socketId) {
                    sistema.propietarioId = atacante.socketId;
                }
                sistema.bajoAtaque = false;
            }

            const defensor = (estado.jugadores || []).find((item) => item.nickname === playerName || item.socketId === playerSocketId);
            if (defensor) {
                defensor.sistemas = Array.isArray(defensor.sistemas) ? defensor.sistemas.filter((id) => id !== data?.sistemaId) : [];
                defensor.sistemasControlados = defensor.sistemas.length;
            }

            if (atacante) {
                atacante.sistemas = Array.isArray(atacante.sistemas) ? atacante.sistemas : [];
                if (data?.sistemaId && !atacante.sistemas.includes(data.sistemaId)) {
                    atacante.sistemas.push(data.sistemaId);
                }
                atacante.sistemasControlados = atacante.sistemas.length;
            }
        });

        setEventos((prev) => [
            {
                tipo: "owner_change",
                hora: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
                jugador: data?.atacante || "Enemigo",
                mensaje: `conquistó ${data?.sistemaNombre || "un sistema tuyo"}`,
                color: "#ff6b6b",
            },
            ...(prev || []),
        ].slice(0, 25));
    };

    // Conectar socket y obtener funciones de emisión
    const { emitirConstruir, emitirEnviarFlotas, emitirAtacar, emitirTeclaU } = useSocket({
        partidaId,
        playerName,
        onGameStarted,
        onGameState,
        onCountdown,
        onProductionTimer,
        onCountdownInicioU,
        onInicioUCompletado,
        onInicioUResultado,
        onBattleStart,
        onBattleResult,
        onGameOver,
        onConstruirResultado,
        onFlotasResultado,
        onAtaqueResultado,
        onSistemaConquistado,
        setPlayerSocketId,
    });

    // ======================================================
    // NOMBRE: efecto de validación de partidaId
    // ENTRADA: partidaId
    // SALIDA: estado de error si no hay partidaId
    // RESTRICCIONES: ninguna
    // OBJETIVO: detectar partidas inválidas al cargar
    // ======================================================
    useEffect(() => {
        if (!partidaId) {
            setMensajeInicio("No se encontró el código de partida");
            setEstado("error");
        }
    }, [partidaId]);

    // ======================================================
    // NOMBRE: efecto del temporizador de partida
    // ENTRADA: estado, inicioPartida
    // SALIDA: partidaTimer actualizado cada segundo
    // RESTRICCIONES: solo corre cuando la partida está activa
    // OBJETIVO: mostrar el tiempo transcurrido de la partida
    // ======================================================
    useEffect(() => {
        if (estado !== "activo" || !inicioPartida) {
            setPartidaTimer(0);
            return undefined;
        }
        const tick = () => setPartidaTimer(Math.floor((Date.now() - inicioPartida) / 1000));
        tick();
        const intervalo = setInterval(tick, 1000);
        return () => clearInterval(intervalo);
    }, [estado, inicioPartida]);

    // ======================================================
    // NOMBRE: efecto de sincronización del sistema seleccionado
    // ENTRADA: sistemas, seleccionado, sistemaInicial
    // SALIDA: seleccionado actualizado cuando cambia el estado del servidor
    // RESTRICCIONES: ninguna
    // OBJETIVO: mantener el panel lateral sincronizado con el estado real
    // ======================================================
    const playerState = jugadorSnapshot || getPlayerState(estadoServidor, playerName, playerSocketId);
    const playerStateNickname = String(playerState?.nickname || playerName || "").trim();
    const playerStateNicknameNormalizado = playerStateNickname.toLowerCase();
    const playerStateSocketId = String(playerState?.socketId || playerSocketId || "").trim();
    const sistemaInicialId = playerState?.sistemaInicialId || null;
    const sistemaInicial = useMemo(
        () => sistemas.find((s) => s.id === sistemaInicialId) || null,
        [sistemaInicialId, sistemas]
    );

    useEffect(() => {
        if (!sistemaInicial) return;
        if (!seleccionado || !sistemas.some((s) => s.id === seleccionado.id)) {
            setSeleccionado(sistemaInicial);
        }
    }, [seleccionado, sistemaInicial, sistemas]);

    useEffect(() => {
        if (!seleccionado?.id) return;
        const actualizado = sistemas.find((s) => s.id === seleccionado.id);
        if (actualizado && actualizado !== seleccionado) {
            setSeleccionado(actualizado);
        }
    }, [sistemas, seleccionado]);

    // ======================================================
    // ENTRADA: estado, inicioHabilitado, partidaId
    // SALIDA: evento presionar_tecla_u emitido al presionar U
    // RESTRICCIONES: solo activo cuando la partida está activa y no iniciada
    // OBJETIVO: capturar la tecla U para iniciar la partida
    // ======================================================
    useEffect(() => {
        if (estado !== "activo" || inicioHabilitado) return;
        const onKeyDown = (e) => {
            if (String(e.key || "").toLowerCase() !== "u") return;
            if (!partidaId) return;
            emitirTeclaU();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [estado, inicioHabilitado, partidaId]);

    useEffect(() => {
        if (!movimientoVisual?.expiresAt) return;
        const restante = Math.max(0, movimientoVisual.expiresAt - Date.now());
        const timer = setTimeout(() => setMovimientoVisual(null), restante || 1);
        return () => clearTimeout(timer);
    }, [movimientoVisual]);

    useEffect(() => {
        return () => {
            if (ordenFlotaTimeoutRef.current) {
                clearTimeout(ordenFlotaTimeoutRef.current);
                ordenFlotaTimeoutRef.current = null;
            }
            ordenFlotaEnviadaAtRef.current = null;
        };
    }, []);

    // Auto-cierre de mensajes de alerta para no saturar la UI.
    useEffect(() => {
        if (!alertaAtaque) return;
        const timer = setTimeout(() => setAlertaAtaque(""), 30000);
        return () => clearTimeout(timer);
    }, [alertaAtaque]);

    useEffect(() => {
        if (!alertaAtaque) return undefined;
        const timer = setTimeout(() => setAlertaAtaque(""), 30000);
        return () => clearTimeout(timer);
    }, [alertaAtaque]);

    // Datos derivados
    const recursos = playerState?.recursos || { minerales: 0, energia: 0, cristales: 0 };
    const flotas = playerState?.flotasEnPie || 0;
    const tiempoPartidaRestanteServidor = Number(estadoServidor?.tiempoPartidaRestante);
    const temporizadorPartida = Number.isFinite(tiempoPartidaRestanteServidor) && tiempoPartidaRestanteServidor >= 0
        ? tiempoPartidaRestanteServidor
        : (estado === "activo" ? partidaTimer : countdown ?? 0);
    const sistemaControlado = Boolean(
        playerState?.sistemas?.includes(seleccionado?.id)
        || (
            seleccionado
            && (
                (seleccionado.propietarioId && String(seleccionado.propietarioId).trim() === playerStateSocketId)
                || (
                    String(seleccionado.propietario || "").trim().toLowerCase()
                    === playerStateNicknameNormalizado
                )
            )
        )
    );
    const totalSistemas = Math.max(1, sistemas.length || 1);
    const playerNameNormalizado = playerStateNicknameNormalizado || String(playerName || "").trim().toLowerCase();
    const sistemasPropiosPorMapa = sistemas.filter((sistema) => {
        const ownerId = String(sistema?.propietarioId || "").trim();
        const myId = playerStateSocketId;
        const ownerName = String(sistema?.propietario || "").trim().toLowerCase();
        return (ownerId && myId && ownerId === myId) || (ownerName && ownerName === playerNameNormalizado);
    });
    const sistemasControlados = Number(
        playerState?.sistemasControlados
        || playerState?.sistemas?.length
        || sistemasPropiosPorMapa.length
        || 0
    );
    const porcentajeControl = Math.round((sistemasControlados / totalSistemas) * 100);
    const metaVictoriaPorcentaje = Number(estadoServidor?.porcentajeVictoria || 60);
    const metaVictoriaSistemas = Math.max(1, Math.ceil((metaVictoriaPorcentaje / 100) * totalSistemas));

    const rankingActual = (estadoServidor?.jugadores || [])
        .map((jugador) => ({
            nickname: jugador.nickname,
            puntaje: Number(jugador?.puntaje || 0),
        }))
        .sort((a, b) => b.puntaje - a.puntaje);

    const posicionRanking = Math.max(
        1,
        rankingActual.findIndex(
            (jugador) => String(jugador.nickname || "").trim().toLowerCase() === playerNameNormalizado
        ) + 1 || 1
    );
    const sistemasPropios = sistemasPropiosPorMapa.length > 0
        ? sistemasPropiosPorMapa
        : sistemas.filter((sistema) => {
            const ownSystemIds = new Set(playerState?.sistemas || []);
            return ownSystemIds.has(sistema.id);
        });

    const puntosPorSistemas = sistemasControlados * 5000;
    const puntosPorRecursos =
        (Number(recursos.minerales || 0) * 1)
        + (Number(recursos.energia || 0) * 2)
        + (Number(recursos.cristales || 0) * 3);
    const puntosPorInfraestructura = sistemasPropios.reduce((total, sistema) => (
        total + ((Number(sistema.fortalezas || 0) * 100) + (Number(sistema.centrales || 0) * 150))
    ), 0);
    const puntajeTotalCalculado = puntosPorSistemas + puntosPorRecursos + puntosPorInfraestructura;
    const puntajeJugador = Number.isFinite(Number(playerState?.puntaje))
        ? Number(playerState.puntaje)
        : Number(puntajeTotalCalculado || 0);
    const topJugadores = rankingActual.slice(0, 5).map((jugador, index) => {
        const estadoJugador = (estadoServidor?.jugadores || []).find((item) => item.nickname === jugador.nickname);
        const sistemasJugador = Number(estadoJugador?.sistemasControlados || estadoJugador?.sistemas?.length || 0);
        const porcentajeJugador = Math.round((sistemasJugador / totalSistemas) * 100);

        return {
            posicion: index + 1,
            nickname: jugador.nickname,
            puntaje: jugador.puntaje,
            sistemasControlados: sistemasJugador,
            porcentajeControl: porcentajeJugador,
        };
    });

    const jugadoresActivos = (estadoServidor?.jugadores || []).filter((jugador) => !jugador.eliminado).length;

    const planetaSeleccionado = useMemo(
        () => inferSelectedDetails(seleccionado, playerState),
        [seleccionado, playerState]
    );

    const eventosVisibles = useMemo(() => {
        const visibles = [];

        for (const evento of eventos || []) {
            if (!evento) continue;
            if (evento.tipo === "production") continue;
            visibles.push(evento);
        }

        return visibles;
    }, [eventos]);

    // Acciones
    const handlePlanetSelect = (sistema) => {
        setSeleccionado(sistema);
    };

    const abrirDetalles = () => {
        if (!seleccionado) return;
        setModalBatalla(false);
        setModalDetalles(true);
    };

    const abrirConstruccion = () => {
        if (!seleccionado) return;
        if (!inicioHabilitado) {
            setAlertaAtaque("Debes presionar U para iniciar la partida.");
            return;
        }
        setModalConstruir(true);
    };

    const abrirFlotas = () => {
        if (!seleccionado) return;
        if (!inicioHabilitado) {
            setAlertaAtaque("Debes presionar U para iniciar la partida.");
            return;
        }
        setFormFlota({ destino: "", cantidad: 1 });
        setModalFlota(true);
    };

    const enviarConstruccion = () => {
        if (!seleccionado) return;
        const costo = getCostoConstruccion(formConstruccion);
        aplicarEstadoOptimista((estado) => {
            const jugador = (estado.jugadores || []).find((item) => item.socketId === playerSocketId || item.nickname === playerName);
            const sistema = estado.galaxia?.sistemas?.find((item) => item.id === seleccionado.id);
            if (jugador) {
                jugador.recursos.minerales = Math.max(0, (jugador.recursos.minerales || 0) - costo.minerales);
                jugador.recursos.energia = Math.max(0, (jugador.recursos.energia || 0) - costo.energia);
                jugador.recursos.cristales = Math.max(0, (jugador.recursos.cristales || 0) - costo.cristales);
            }
            if (sistema) {
                if (formConstruccion === "mina") sistema.minas = (sistema.minas || 0) + 1;
                if (formConstruccion === "central") sistema.centrales = (sistema.centrales || 0) + 1;
                if (formConstruccion === "astillero") sistema.astilleros = (sistema.astilleros || 0) + 1;
                if (formConstruccion === "fortaleza") sistema.fortalezas = (sistema.fortalezas || 0) + 1;
            }
        });
        agregarEventoLocal({
            tipo: "build",
            hora: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
            jugador: playerStateNickname || playerName,
            mensaje: `construyó ${formConstruccion} en ${seleccionado.nombre}`,
            color: "#00ff88",
        });
        emitirConstruir(seleccionado.id, formConstruccion);
        setAlertaAtaque("Construcción enviada.");
        setModalConstruir(false);
    };

    const enviarFlotas = () => {
        if (!seleccionado || !formFlota.destino) return;
        if (ordenFlotaPendiente) {
            setAlertaAtaque("Espera: hay una orden de flota en proceso de confirmación.");
            return;
        }
        const cantidad = Number(formFlota.cantidad) || 0;
        const destino = sistemas.find((item) => item.id === formFlota.destino);
        const esMioPorId = Boolean(playerSocketId && destino?.propietarioId && destino.propietarioId === playerSocketId);
        const esMioPorNombre = Boolean(destino?.propietario && String(destino.propietario).trim().toLowerCase() === String(playerName || "").trim().toLowerCase());
        const destinoEsHostil = Boolean(
            destino && (
                (destino.propietarioId && !esMioPorId)
                || (destino.propietario && !esMioPorNombre)
            )
        );

        accionFlotaPendienteRef.current = {
            origenId: seleccionado.id,
            origenNombre: seleccionado.nombre,
            destinoId: formFlota.destino,
            destinoNombre: destino?.nombre || formFlota.destino,
            tipo: destinoEsHostil ? "ataque" : "movimiento",
            cantidad,
        };

        setOrdenFlotaPendiente(true);
        ordenFlotaEnviadaAtRef.current = Date.now();
        if (ordenFlotaTimeoutRef.current) {
            clearTimeout(ordenFlotaTimeoutRef.current);
        }
        ordenFlotaTimeoutRef.current = setTimeout(() => {
            setOrdenFlotaPendiente(false);
            accionFlotaPendienteRef.current = null;
            setAlertaAtaque("Sin confirmación directa del servidor. Intenta enviar de nuevo.");
            ordenFlotaTimeoutRef.current = null;
            ordenFlotaEnviadaAtRef.current = null;
        }, 12000);
        emitirEnviarFlotas(seleccionado.id, formFlota.destino, formFlota.cantidad);
        setAlertaAtaque("Orden enviada. Esperando confirmación del servidor...");
        setModalFlota(false);
    };

    const enviarAtaque = () => {
        if (!seleccionado || !formFlota.destino) return;
        if (ordenFlotaPendiente) {
            setAlertaAtaque("Espera: hay una orden de ataque en proceso de confirmación.");
            return;
        }
        const cantidad = Number(formFlota.cantidad) || 0;
        const destino = sistemas.find((item) => item.id === formFlota.destino);

        accionFlotaPendienteRef.current = {
            origenId: seleccionado.id,
            origenNombre: seleccionado.nombre,
            destinoId: formFlota.destino,
            destinoNombre: destino?.nombre || formFlota.destino,
            tipo: "ataque",
            cantidad,
        };

        setOrdenFlotaPendiente(true);
        ordenFlotaEnviadaAtRef.current = Date.now();
        if (ordenFlotaTimeoutRef.current) {
            clearTimeout(ordenFlotaTimeoutRef.current);
        }
        ordenFlotaTimeoutRef.current = setTimeout(() => {
            setOrdenFlotaPendiente(false);
            accionFlotaPendienteRef.current = null;
            setAlertaAtaque("Sin confirmación directa del servidor. Intenta atacar de nuevo.");
            ordenFlotaTimeoutRef.current = null;
            ordenFlotaEnviadaAtRef.current = null;
        }, 12000);
        emitirAtacar(seleccionado.id, formFlota.destino, formFlota.cantidad);
        setAlertaAtaque("Conquista enviada. Esperando confirmación del servidor...");
        setModalFlota(false);
    };

    return {
        // Estado
        estado,
        mensajeInicio,
        countdown,
        sistemas,
        recursos,
        flotas,
        sistemasControlados,
        totalSistemas,
        porcentajeControl,
        puntajeJugador,
        puntajeTotalCalculado,
        puntosPorSistemas,
        puntosPorRecursos,
        puntosPorInfraestructura,
        posicionRanking,
        metaVictoriaPorcentaje,
        metaVictoriaSistemas,
        topJugadores,
        jugadoresActivos,
        produccionTimer,
        temporizadorPartida,
        ganador,
        resumenPartida,
        tematica: estadoServidor?.tematica || "clasica",
        alertaAtaque,
        setAlertaAtaque,
        inicioHabilitado,
        countdownInicioU,
        playerState,
        sistemaInicial,
        seleccionado,
        planetaSeleccionado,
        sistemaControlado,
        eventosVisibles,
        ultimoSync,
        movimientoVisual,
        ordenFlotaPendiente,
        // Modales
        modalConstruir,
        modalFlota,
        modalDetalles,
        modalBatalla,
        eventoBatalla,
        setModalConstruir,
        setModalFlota,
        setModalDetalles,
        setModalBatalla,
        // Formularios
        formConstruccion,
        setFormConstruccion,
        formFlota,
        setFormFlota,
        // Acciones
        handlePlanetSelect,
        abrirDetalles,
        abrirConstruccion,
        abrirFlotas,
        enviarConstruccion,
        enviarFlotas,
        enviarAtaque,
        playerSocketId,
    };
}