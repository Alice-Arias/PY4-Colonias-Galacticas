import "../styles/UnirsePartida.css";
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import socket from "../services/socket";
import backgroundLogin from "../assets/backgroundLogin.jpeg";
import LobbyPlayersPanel from "../components/LobbyPlayersPanel";

import { PiDiamondsFourLight } from "react-icons/pi";

export default function UnirsePartida() {
    const location = useLocation();
    const navigate = useNavigate();
    const fxRef = useRef(null);

    const [partidaId, setPartidaId] = useState(location.state?.partidaId || "");
    const [lobby, setLobby] = useState(null);

    const nickname = localStorage.getItem("nickname");

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

    const unirse = () => {
        if (!partidaId.trim()) return;
        socket.emit("join_game", { partidaId, nickname });
    };

    useEffect(() => {
        const handleLobby = (data) => setLobby(data);
        const handleStart = (data) => alert(data.mensaje);

        socket.on("lobby_update", handleLobby);
        socket.on("game_started", handleStart);

        return () => {
            socket.off("lobby_update", handleLobby);
            socket.off("game_started", handleStart);
        };
    }, []);

    // Iniciales para el avatar
    const getInitials = (name) => name?.slice(0, 2).toUpperCase() ?? "??";

    return (
        <div
            className="unirse-page"
            style={{ backgroundImage: `url(${backgroundLogin})` }}
        >
            <div className="unirse-bg-fx" ref={fxRef}></div>

            <div className="unirse-overlay">
                <div className="unirse-layout">
                    {/* Card izquierda */}
                    <div className="unirse-card">
                        <div className="unirse-header">
                            <span className="unirse-eyebrow">
                                ◆ Colonias Galácticas ◆
                            </span>
                            <h1 className="unirse-title">Lobby</h1>
                        </div>

                        <p className="unirse-section-label">Acceso a partida</p>

                        <div className="unirse-form-group">
                            <label htmlFor="partidaId">ID de partida</label>
                            <input
                                id="partidaId"
                                className="unirse-field"
                                placeholder="Ingresa el código de partida"
                                value={partidaId}
                                onChange={(e) => setPartidaId(e.target.value)}
                            />
                        </div>

                        <button className="unirse-btn-primary" onClick={unirse}>
                            Unirse a partida
                        </button>
                        <button className="unirse-btn-back" onClick={() => navigate("/")}>
                            Volver al inicio
                      </button>
                    </div>

                    {/* Panel derecho */}
                    <LobbyPlayersPanel lobby={lobby} />
                </div>
            </div>
        </div>
    );
}
