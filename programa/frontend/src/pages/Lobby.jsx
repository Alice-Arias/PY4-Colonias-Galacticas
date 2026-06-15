import "../styles/Lobby.css";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import backgroundLogin from "../assets/backgroundLogin.jpeg";
import socket from "../services/socket";
import LobbyPlayersPanel from "../components/LobbyPlayersPanel";

function Lobby() {
    const fxRef = useRef(null);
    const gameStartFallbackRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const [countdown, setCountdown] = useState(null); //Para el contador de inicio de partida
    const [tiempoRestante, setTiempoRestante] = useState(null); //Para el tiempo de espera de la partida
    const [mensajeFinal, setMensajeFinal] = useState(false);

    const [lobby, setLobby] = useState(location.state?.lobbyInicial || null);

    const partidaId = location.state?.partidaId || sessionStorage.getItem("partidaId") || localStorage.getItem("partidaId");
    const isHost = location.state?.isHost ?? false;
    const salaCompleta = Boolean(lobby?.jugadores?.length && lobby?.maxJugadores && lobby.jugadores.length >= lobby.maxJugadores);

    useEffect(() => {
        if (partidaId) {
            sessionStorage.setItem("partidaId", partidaId);
            localStorage.setItem("partidaId", partidaId);
        }
    }, [partidaId]);

    useEffect(() => {
        const el = fxRef.current;
        if (!el) return;
        for (let i = 0; i < 14; i++) {
            const line = document.createElement("div");
            line.className = "warp-line";
            const w = Math.random() * 120 + 40;
            line.style.cssText = `
                top: ${Math.random() * 100}%;
                left: 0;
                width: ${w}px;
                --dur: ${(Math.random() * 5 + 3).toFixed(1)}s;
                --delay: -${(Math.random() * 8).toFixed(1)}s;
            `;
            el.appendChild(line);
        }
    }, [navigate]);

    useEffect(() => {
        const handleLobbyUpdate = (data) => {
            setLobby(data);
            if (data.tiempoRestante !== undefined) {
                setTiempoRestante(data.tiempoRestante);
            }
        };
        const handleGameStarted = () => {
            if (gameStartFallbackRef.current) {
                clearTimeout(gameStartFallbackRef.current);
                gameStartFallbackRef.current = null;
            }
            setCountdown(null);
            setMensajeFinal(true);

            setTimeout(() => {
                navigate("/partida");
            }, 1200);
        };

        const handleTiempoRestanteUpdate = (data) => {
            setTiempoRestante(data.tiempoRestante);
        };

        const handlePartidaExpirada = () => {
            alert("La partida ha expirado por falta de jugadores");
            navigate("/");
        };

        socket.on("lobby_update", handleLobbyUpdate);
        socket.on("game_started", handleGameStarted);
        socket.on("tiempo_restante_update", handleTiempoRestanteUpdate);
        socket.on("partida_expirada", handlePartidaExpirada);

        return () => {
            socket.off("lobby_update", handleLobbyUpdate);
            socket.off("game_started", handleGameStarted);
            socket.off("tiempo_restante_update", handleTiempoRestanteUpdate);
            socket.off("partida_expirada", handlePartidaExpirada);
        };
    }, [navigate]);

    const iniciarPartida = () => {
        socket.emit("start_game", partidaId);
    };

    const formatearTiempo = (segundos) => {
        const mins = Math.floor(segundos / 60);
        const segs = segundos % 60;
        return `${mins}:${segs.toString().padStart(2, "0")}`;
    };

    useEffect(() => {
        const handleCountdown = (segundos) => {
            setCountdown(segundos);
        };

        socket.on("countdown", handleCountdown);

        return () => {
            socket.off("countdown", handleCountdown);
            if (gameStartFallbackRef.current) {
                clearTimeout(gameStartFallbackRef.current);
                gameStartFallbackRef.current = null;
            }
        };
    }, [navigate]);

    useEffect(() => {
        if (countdown !== 0) return;

        if (gameStartFallbackRef.current) {
            clearTimeout(gameStartFallbackRef.current);
        }

        gameStartFallbackRef.current = setTimeout(() => {
            setMensajeFinal(true);
            navigate("/partida");
        }, 1800);

        return () => {
            if (gameStartFallbackRef.current) {
                clearTimeout(gameStartFallbackRef.current);
                gameStartFallbackRef.current = null;
            }
        };
    }, [countdown, navigate]);

    useEffect(() => {
        if (mensajeFinal && countdown === null) {
            const redirectTimeout = setTimeout(() => {
                navigate("/partida");
            }, 600);

            return () => clearTimeout(redirectTimeout);
        }
    }, [mensajeFinal, countdown, navigate]);

    return (
        <div
            className="lobby-page"
            style={{ backgroundImage: `url(${backgroundLogin})` }}
        >
            <div className="lobby-bg-fx" ref={fxRef}></div>

            <div className="lobby-overlay">
                <div className="lobby-card">
                    <div className="lobby-header">
                        <span className="lobby-eyebrow">
                            ◆ Conflicto Interestelar ◆
                        </span>
                        <h1 className="lobby-title">Lobby de Partida</h1>
                    </div>

                    {tiempoRestante !== null && (
                        <div className="lobby-timer">
                            <div className="lobby-timer-label">Tiempo de espera</div>
                            <div className="lobby-timer-display">
                                <span className="lobby-timer-icon">⏱</span>
                                <span className="lobby-timer-text">{formatearTiempo(tiempoRestante)}</span>
                            </div>
                        </div>
                    )}

                    <LobbyPlayersPanel lobby={lobby} partidaId={partidaId} />

                    <div className="lobby-actions">
                        {isHost && (
                            <button
                                className="lobby-primary-btn"
                                onClick={iniciarPartida}
                                disabled={!salaCompleta}
                                title={salaCompleta ? "Entrar al juego" : "Esperando que se complete la sala"}
                            >
                                Entrar al juego
                            </button>
                        )}
                        <button
                            className="lobby-secondary-btn"
                            onClick={() => navigate("/")}
                        >
                            Volver al inicio
                        </button>
                    </div>
                </div>
            </div>
            {countdown !== null && (
                <div className="lobby-countdown">
                    <span key={countdown}>{countdown}</span>
                </div>
            )}
            {mensajeFinal && (
                <div className="lobby-countdown">
                    <span className="lobby-mensaje-final">¡QUE COMIENCE<br/>LA CONQUISTA!</span>
                </div>
            )}
        </div>
    );
}

export default Lobby;
