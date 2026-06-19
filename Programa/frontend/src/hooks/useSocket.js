// ======================================================
// NOMBRE: useSocket
// ENTRADA: partidaId, playerName y callbacks para actualizar estado
// SALIDA: funciones para emitir eventos al servidor
// RESTRICCIONES: requiere socket conectado y partidaId válido
// OBJETIVO: centralizar toda la comunicación con el servidor via WebSockets
// ======================================================

import { useEffect, useRef } from "react";
import socket from "../services/socket";

export function useSocket({
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
}) {
    const temporizadorModalBatallaRef = useRef(null);

    // ======================================================
    // NOMBRE: efecto principal de sockets
    // ENTRADA: partidaId y playerName
    // SALIDA: listeners registrados y cleanup al desmontar
    // RESTRICCIONES: solo registrar si partidaId es válido
    // OBJETIVO: conectar y desconectar eventos de socket correctamente
    // ======================================================
    useEffect(() => {
        if (!partidaId) return;

        const handleConnect = () => {
            setPlayerSocketId(socket.id || null);
            socket.emit("join_game", { partidaId, nickname: playerName });
        };

        const handleGameStarted = (payload) => {
            onGameStarted(payload);
        };

        const handleGameState = (payload) => {
            onGameState(payload);
        };

        const handleCountdown = (segundos) => {
            onCountdown(segundos);
        };

        const handleProductionTimer = ({ segundosRestantes }) => {
            if (typeof segundosRestantes === "number") {
                onProductionTimer(segundosRestantes);
            }
        };

        const handleCountdownInicioU = ({ segundosRestantes }) => {
            onCountdownInicioU(segundosRestantes);
        };

        const handleInicioUCompletado = () => {
            onInicioUCompletado();
        };

        const handleInicioUResultado = (resultado) => {
            onInicioUResultado(resultado);
        };

        const handleBattleStart = (data) => {
            if (temporizadorModalBatallaRef.current) {
                clearTimeout(temporizadorModalBatallaRef.current);
            }
            onBattleStart(data);
            temporizadorModalBatallaRef.current = setTimeout(() => {
                onBattleStart(null);
            }, 3500);
        };

        const handleBattleResult = (data) => {
            if (temporizadorModalBatallaRef.current) {
                clearTimeout(temporizadorModalBatallaRef.current);
                temporizadorModalBatallaRef.current = null;
            }
            onBattleResult(data);

            // Cerrar automáticamente el modal de resultado para evitar overlay oscuro persistente.
            temporizadorModalBatallaRef.current = setTimeout(() => {
                onBattleStart(null);
                temporizadorModalBatallaRef.current = null;
            }, 3500);
        };

        const handleIncomingAttack = (data) => {
            if (temporizadorModalBatallaRef.current) {
                clearTimeout(temporizadorModalBatallaRef.current);
            }
            onBattleStart({
                tipo: "inicio",
                atacante: data.atacante,
                defensor: playerName,
                sistemaNombre: data.sistema,
                flotasAtacantes: data.flotasAtacantes,
                defensa: data.defensa,
            });
            temporizadorModalBatallaRef.current = setTimeout(() => {
                onBattleStart(null);
            }, 3500);
        };

        const handleGameOver = (data) => {
            onGameOver(data);
        };

        const handleJugadorEliminado = (data) => {
            // Notificar que un jugador fue eliminado
            if (onBattleResult) {
                onBattleResult({
                    atacante: "Sistema",
                    defensor: data.nickname,
                    ganador: "Sistema",
                    mensaje: `${data.nickname} ha sido eliminado del juego`,
                });
            }
        };

        const handleConstruirResultado = (resultado) => {
            onConstruirResultado(resultado);
            socket.emit("get_game_state", partidaId);
        };

        const handleFlotasResultado = (resultado) => {
            onFlotasResultado(resultado);
            socket.emit("get_game_state", partidaId);
        };

        const handleAtaqueResultado = (resultado) => {
            onAtaqueResultado(resultado);
            socket.emit("get_game_state", partidaId);
        };

        const handleCombatCompleted = (data) => {
            if (temporizadorModalBatallaRef.current) {
                clearTimeout(temporizadorModalBatallaRef.current);
                temporizadorModalBatallaRef.current = null;
            }
            onBattleResult(data?.resultado);
            socket.emit("get_game_state", partidaId);
        };

        const handleSistemaConquistado = (data) => {
            if (onSistemaConquistado) {
                onSistemaConquistado(data);
            }
            socket.emit("get_game_state", partidaId);
        };

        // Registrar todos los listeners
        socket.on("connect", handleConnect);
        socket.on("game_started", handleGameStarted);
        socket.on("game_state_update", handleGameState);
        socket.on("countdown", handleCountdown);
        socket.on("production_timer", handleProductionTimer);
        socket.on("countdown_inicio_u", handleCountdownInicioU);
        socket.on("inicio_u_completado", handleInicioUCompletado);
        socket.on("inicio_u_resultado", handleInicioUResultado);
        socket.on("battle_start", handleBattleStart);
        socket.on("battle_result", handleBattleResult);
        socket.on("incoming_attack", handleIncomingAttack);
        socket.on("combat_completed", handleCombatCompleted);
        socket.on("game_over", handleGameOver);
        socket.on("jugador_eliminado", handleJugadorEliminado);
        socket.on("construir_resultado", handleConstruirResultado);
        socket.on("flotas_resultado", handleFlotasResultado);
        socket.on("ataque_resultado", handleAtaqueResultado);
        socket.on("sistema_conquistado", handleSistemaConquistado);

        // Conectar al entrar
        setPlayerSocketId(socket.id || null);
        socket.emit("join_game", { partidaId, nickname: playerName });
        socket.emit("get_game_state", partidaId);

        // Pull periódico de respaldo para mantener grafo/colores sincronizados en todo momento.
        const pollingEstado = setInterval(() => {
            if (!partidaId || !socket.connected) return;
            socket.emit("get_game_state", partidaId);
        }, 1000);

        // Cleanup al desmontar
        return () => {
            clearInterval(pollingEstado);
            socket.off("connect", handleConnect);
            socket.off("game_started", handleGameStarted);
            socket.off("game_state_update", handleGameState);
            socket.off("countdown", handleCountdown);
            socket.off("production_timer", handleProductionTimer);
            socket.off("countdown_inicio_u", handleCountdownInicioU);
            socket.off("inicio_u_completado", handleInicioUCompletado);
            socket.off("inicio_u_resultado", handleInicioUResultado);
            socket.off("battle_start", handleBattleStart);
            socket.off("battle_result", handleBattleResult);
            socket.off("incoming_attack", handleIncomingAttack);
            socket.off("combat_completed", handleCombatCompleted);
            socket.off("game_over", handleGameOver);
            socket.off("jugador_eliminado", handleJugadorEliminado);
            socket.off("construir_resultado", handleConstruirResultado);
            socket.off("flotas_resultado", handleFlotasResultado);
            socket.off("ataque_resultado", handleAtaqueResultado);
            socket.off("sistema_conquistado", handleSistemaConquistado);
            if (temporizadorModalBatallaRef.current) {
                clearTimeout(temporizadorModalBatallaRef.current);
                temporizadorModalBatallaRef.current = null;
            }
        };
    }, [partidaId, playerName]);

    // ======================================================
    // NOMBRE: emitirConstruir
    // ENTRADA: sistemaId y tipoEdificio
    // SALIDA: evento construir emitido al servidor
    // RESTRICCIONES: requiere socket conectado y partidaId válido
    // OBJETIVO: enviar orden de construcción al backend
    // ======================================================
    const emitirConstruir = (sistemaId, tipoEdificio) => {
        socket.emit("construir", { partidaId, sistemaId, tipoEdificio });
    };

    // ======================================================
    // NOMBRE: emitirEnviarFlotas
    // ENTRADA: origen, destino y cantidad de flotas
    // SALIDA: evento enviar_flotas emitido al servidor
    // RESTRICCIONES: requiere socket conectado y partidaId válido
    // OBJETIVO: enviar orden de movimiento de flotas al backend
    // ======================================================
    const emitirEnviarFlotas = (origen, destino, cantidad) => {
        socket.emit("enviar_flotas", { partidaId, origen, destino, cantidad: Number(cantidad) });
    };

    // ======================================================
    // NOMBRE: emitirAtacar
    // ENTRADA: origen, destino y cantidad de flotas
    // SALIDA: evento atacar emitido al servidor
    // RESTRICCIONES: requiere socket conectado y partidaId válido
    // OBJETIVO: iniciar una conquista automática contra un sistema enemigo
    // ======================================================
    const emitirAtacar = (origen, destino, cantidad) => {
        socket.emit("atacar", { partidaId, origen, destino, cantidad: Number(cantidad) });
    };

    // ======================================================
    // NOMBRE: emitirTeclaU
    // ENTRADA: ninguna
    // SALIDA: evento presionar_tecla_u emitido al servidor
    // RESTRICCIONES: requiere socket conectado y partidaId válido
    // OBJETIVO: notificar al backend que el jugador presionó U para iniciar
    // ======================================================
    const emitirTeclaU = () => {
        socket.emit("presionar_tecla_u", { partidaId, nickname: playerName });
    };

    return {
        emitirConstruir,
        emitirEnviarFlotas,
        emitirAtacar,
        emitirTeclaU,
    };
}