import "../styles/Lobby.css";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import backgroundLogin from "../assets/backgroundLogin.jpeg";
import socket from "../services/socket";
import LobbyPlayersPanel from "../components/LobbyPlayersPanel";

function Lobby() {
    const fxRef    = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const [lobby, setLobby] = useState(location.state?.lobbyInicial || null);

    const partidaId = location.state?.partidaId;
    const isHost    = location.state?.isHost ?? false;

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
        const handleLobbyUpdate = (data) => setLobby(data);
        const handleGameStarted = () => navigate("/partida");

        socket.on("lobby_update", handleLobbyUpdate);
        socket.on("game_started", handleGameStarted);

        return () => {
            socket.off("lobby_update", handleLobbyUpdate);
            socket.off("game_started", handleGameStarted);
        };
    }, [navigate]);

    const iniciarPartida = () => {
        socket.emit("start_game", partidaId);
    };

    return (
        <div
            className="lobby-page"
            style={{ backgroundImage: `url(${backgroundLogin})` }}
        >
            <div className="lobby-bg-fx" ref={fxRef}></div>

            <div className="lobby-overlay">
                <div className="lobby-card">

                    <div className="lobby-header">
                        <span className="lobby-eyebrow">◆ Conflicto Interestelar ◆</span>
                        <h1 className="lobby-title">Lobby de Partida</h1>
                    </div>

                    <LobbyPlayersPanel
                        lobby={lobby}
                        partidaId={partidaId}
                    />

                    <div className="lobby-actions">
                        {isHost && (
                            <button className="lobby-primary-btn" onClick={iniciarPartida}>
                                Iniciar Partida
                            </button>
                        )}
                        <button className="lobby-secondary-btn" onClick={() => navigate("/")}>
                            Volver al inicio
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Lobby;