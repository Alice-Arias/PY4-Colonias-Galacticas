import "../styles/UnirsePartida.css";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../services/socket";
import backgroundLogin from "../assets/backgroundLogin.jpeg";
import "../components/LobbyPlayersPanel";

const getStoredNickname = () => sessionStorage.getItem("nickname") || localStorage.getItem("nickname") || "";

export default function UnirsePartida() {
    const navigate = useNavigate();
    const fxRef = useRef(null);

    const [partidas, setPartidas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const nickname = getStoredNickname();

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
    }, []);

    useEffect(() => {
        let timeoutCarga = null;

        const solicitarPartidas = () => {
            setCargando(true);
            socket.emit("get_available_games");
            if (timeoutCarga) clearTimeout(timeoutCarga);
            timeoutCarga = setTimeout(() => {
                setCargando(false);
                setError("No se pudo cargar el lobby. Verifica que el backend esté activo.");
            }, 5000);
        };

        // Solicitar partidas disponibles al conectar
        if (socket.connected) {
            solicitarPartidas();
        }

        socket.on("connect", solicitarPartidas);

        socket.on("connect_error", () => {
            setCargando(false);
            setError("No se pudo conectar al servidor de partidas.");
        });

        socket.on("disconnect", () => {
            setCargando(false);
            setError("Se perdió la conexión con el servidor.");
        });

        socket.on("available_games", (partidasDisponibles) => {
            setPartidas(partidasDisponibles);
            setCargando(false);
            setError("");
            if (timeoutCarga) clearTimeout(timeoutCarga);
        });

        socket.on("tiempo_restante_update", (data) => {
            setPartidas((prevPartidas) =>
                prevPartidas.map((p) => ({
                    ...p,
                    tiempoRestante: data.tiempoRestante,
                }))
            );
        });

        socket.on("partida_expirada", () => {
            solicitarPartidas();
        });

        // Actualizar partidas cada 2 segundos
        const intervalo = setInterval(() => {
            if (socket.connected) {
                solicitarPartidas();
            }
        }, 2000);

        return () => {
            clearInterval(intervalo);
            if (timeoutCarga) clearTimeout(timeoutCarga);
            socket.off("connect", solicitarPartidas);
            socket.off("connect_error");
            socket.off("disconnect");
            socket.off("available_games");
            socket.off("tiempo_restante_update");
            socket.off("partida_expirada");
        };
    }, []);

    const unirse = (partidaId) => {
        const handleJoinedGame = (partida) => {
            sessionStorage.setItem("partidaId", partida.id);
            localStorage.setItem("partidaId", partida.id);
            navigate("/lobby", {
                state: {
                    partidaId: partida.id,
                    isHost: false,
                    lobbyInicial: partida,
                },
            });
        };

        socket.once("joined_game", handleJoinedGame);
        socket.once("join_error", (data) => {
            setError(data?.mensaje || "No se pudo unir a la partida.");
            setCargando(false);
            socket.off("joined_game", handleJoinedGame);
        });

        socket.emit("join_game", {
            partidaId,
            nickname,
        });
    };

    const puedeUnirse = (partida) => {
        return partida.jugadoresActuales < partida.maxJugadores && partida.estado === "esperando";
    };

    const formatearTiempo = (segundos) => {
        const mins = Math.floor(segundos / 60);
        const segs = segundos % 60;
        return `${mins}:${segs.toString().padStart(2, "0")}`;
    };

    return (
        <div
            className="unirse-page"
            style={{ backgroundImage: `url(${backgroundLogin})` }}
        >
            <div className="unirse-bg-fx" ref={fxRef}></div>

            <div className="unirse-overlay">
                <div className="unirse-layout">
                    {/* Card principal */}
                    <div className="unirse-card">
                        <div className="unirse-header">
                            <span className="unirse-eyebrow">
                                ◆ Colonias Galácticas ◆
                            </span>
                            <h1 className="unirse-title">Unirse a una partida</h1>
                        </div>

                        <p className="unirse-section-label">Partidas disponibles</p>

                        {cargando ? (
                            <div className="unirse-loading">
                                <p>Cargando partidas...</p>
                            </div>
                        ) : error ? (
                            <div className="unirse-error">
                                <p>{error}</p>
                            </div>
                        ) : partidas.length === 0 ? (
                            <div className="unirse-empty">
                                <p>No hay partidas disponibles en este momento</p>
                            </div>
                        ) : (
                            <div className="unirse-games-list">
                                {partidas.map((partida) => (
                                    <div key={partida.id} className="unirse-game-card">
                                        <div className="game-card-header">
                                            <h3 className="game-card-name">{partida.nombre}</h3>
                                            <span className="game-card-id">ID: {partida.id}</span>
                                        </div>
                                        <div className="game-card-timer">
                                            <div className="timer-icon">⏱</div>
                                            <div className="timer-text">{formatearTiempo(partida.tiempoRestante)}</div>
                                        </div>
                                        <div className="game-card-details">
                                            <p><strong>Galaxia:</strong> {partida.nombreGalaxia}</p>
                                            <p>
                                                <strong>Jugadores:</strong> {partida.jugadoresActuales}/{partida.maxJugadores}
                                            </p>
                                            <p><strong>Estado:</strong> {partida.estado}</p>
                                        </div>
                                        <button
                                            className={`unirse-btn-join ${!puedeUnirse(partida) ? "disabled" : ""}`}
                                            onClick={() => unirse(partida.id)}
                                            disabled={!puedeUnirse(partida)}
                                        >
                                            {puedeUnirse(partida) ? "Unirse" : "Partida llena"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button className="unirse-btn-back" onClick={() => navigate("/")}>
                            Volver al inicio
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
