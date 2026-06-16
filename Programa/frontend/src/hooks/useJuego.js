// ======================================================
// NOMBRE: useJuego
// ENTRADA: partidaId y playerName
// SALIDA: estado completo del juego y funciones de acción
// RESTRICCIONES: requiere partidaId válido para conectarse
// OBJETIVO: centralizar todo el estado y lógica del componente Juego
// ======================================================

import { useEffect, useMemo, useState } from "react";
import { useSocket } from "./useSocket";
import {
    transformarEstadoServidor,
    getPlayerState,
    inferSelectedDetails,
} from "../utils/transformadores";

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
    const [formConstruccion, setFormConstruccion]     = useState("mina");
    const [formFlota, setFormFlota]                   = useState({ destino: "", cantidad: 1 });
    const [inicioHabilitado, setInicioHabilitado]     = useState(false);
    const [countdownInicioU, setCountdownInicioU]     = useState(null);

    // ======================================================
    // NOMBRE: callbacks de socket
    // ENTRADA: payloads del servidor
    // SALIDA: actualizaciones de estado del juego
    // RESTRICCIONES: cada callback maneja un evento específico
    // OBJETIVO: separar el manejo de cada evento del servidor
    // ======================================================
    const onGameStarted = (payload) => {
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
        setEstadoServidor(payload);
        setSistemas(transformarEstadoServidor(payload));
        setEventos(payload.eventos || []);
        if (typeof payload.tiempoProduccionRestante === "number") {
            setProduccionTimer(payload.tiempoProduccionRestante);
        }
        setInicioHabilitado(Boolean(payload.inicioHabilitado));
        if (payload.ganador) setGanador(payload.ganador);
    };

    const onCountdown = (segundos) => {
        setCountdown(segundos);
        setMensajeInicio(`La conquista empieza en ${segundos}`);
        setEstado("countdown");
    };

    const onProductionTimer = (segundosRestantes) => {
        setProduccionTimer(segundosRestantes);
    };

    const onCountdownInicioU = (segundosRestantes) => {
        setCountdownInicioU(segundosRestantes);
        setAlertaAtaque(`Inicio en ${segundosRestantes}s...`);
    };

    const onInicioUCompletado = () => {
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
        if (!data) {
            setModalBatalla(false);
            return;
        }
        setEventoBatalla({ tipo: "inicio", ...data });
        setModalBatalla(true);
        if (data?.defensor === playerName) {
            setAlertaAtaque(`Ataque entrante en ${data.sistemaNombre}: ${data.flotasAtacantes} flotas enemigas.`);
        }
    };

    const onBattleResult = (data) => {
        setEventoBatalla({ tipo: "resultado", ...data });
        setModalBatalla(true);
        if (data?.ganador) {
            setEventos((prev) => [
                {
                    hora: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
                    jugador: data.ganador,
                    mensaje: `ganó la batalla en ${data.sistemaNombre}`,
                    tipo: data.ataqueGana ? "battle" : "eliminated",
                    color: data.ataqueGana ? "#00ff88" : "#ff4444",
                },
                ...prev,
            ]);
        }
    };

    const onGameOver = (data) => {
        setGanador(data.ganador);
        setEventos(data.eventos || []);
        setEstado("finalizada");
    };

    const onConstruirResultado = (resultado) => {
        setAlertaAtaque(
            resultado?.mensaje ||
            (resultado?.exito ? "Construcción realizada." : "No se pudo construir en el sistema seleccionado.")
        );
    };

    const onFlotasResultado = (resultado) => {
        if (!resultado?.exito) {
            setAlertaAtaque(resultado?.mensaje || "No se pudo enviar la flota.");
        }
    };

    // Conectar socket y obtener funciones de emisión
    const { emitirConstruir, emitirEnviarFlotas, emitirTeclaU } = useSocket({
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
    const playerState = getPlayerState(estadoServidor, playerName, playerSocketId);
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
    // NOMBRE: efecto de tecla U
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

    // Datos derivados
    const recursos = playerState?.recursos || { minerales: 0, energia: 0, cristales: 0 };
    const flotas = estadoServidor?.jugadores?.reduce((t, j) => t + (j.flotasEnPie || 0), 0) || 0;
    const temporizadorPartida = estado === "activo" ? partidaTimer : countdown ?? 0;
    const sistemaControlado = playerState?.sistemas?.includes(seleccionado?.id);

    const planetaSeleccionado = useMemo(
        () => inferSelectedDetails(seleccionado, playerState),
        [seleccionado, playerState]
    );

    const sistemasPropiosNombres = useMemo(() => {
        const ids = new Set(playerState?.sistemas || []);
        return sistemas.filter((s) => ids.has(s.id)).map((s) => s.nombre.toLowerCase());
    }, [playerState?.sistemas, sistemas]);

    const eventosVisibles = useMemo(() => {
        return (eventos || []).filter((evento) => {
            if (!evento) return false;
            if (evento.jugador === "Sistema") return true;
            if (evento.jugador === playerName) return true;
            const mensaje = String(evento.mensaje || "").toLowerCase();
            return sistemasPropiosNombres.some((nombre) => mensaje.includes(nombre));
        });
    }, [eventos, playerName, sistemasPropiosNombres]);

    // Acciones
    const handlePlanetSelect = (sistema) => {
        setSeleccionado(sistema);
        setModalDetalles(true);
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
        emitirConstruir(seleccionado.id, formConstruccion);
        setModalConstruir(false);
    };

    const enviarFlotas = () => {
        if (!seleccionado || !formFlota.destino) return;
        emitirEnviarFlotas(seleccionado.id, formFlota.destino, formFlota.cantidad);
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
        produccionTimer,
        temporizadorPartida,
        ganador,
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
    };
}