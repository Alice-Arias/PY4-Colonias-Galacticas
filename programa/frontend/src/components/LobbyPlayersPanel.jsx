import { PiDiamondsFourLight } from "react-icons/pi";
import "../styles/LobbyPlayersPanel.css";

function LobbyPlayersPanel({ lobby, partidaId }) {

    const getInitials = (name) =>
        name?.slice(0, 2).toUpperCase() ?? "??";

    return (
        <div className="unirse-players-panel">

            <div className="unirse-players-header">
                <span className="unirse-players-title">
                    Jugadores en sala
                </span>

                {lobby && (
                    <span className="unirse-players-count">
                        {lobby.jugadores.length} jugadores
                    </span>
                )}
            </div>

            <div className="unirse-lobby-code">
                <span className="unirse-lobby-label">
                    Código de partida
                </span>

                <span className="unirse-lobby-id">
                    {partidaId}
                </span>
            </div>

            {lobby ? (
                <>
                    <div className="unirse-players-list">
                        {lobby.jugadores.map((j) => (
                            <div
                                className="unirse-player-row"
                                key={j.id}
                            >
                                <div className="unirse-player-avatar">
                                    {getInitials(j.nickname)}
                                </div>

                                <span className="unirse-player-name">
                                    {j.nickname}
                                </span>

                                <span
                                    className={`unirse-player-status ${
                                        j.ready
                                            ? "unirse-status-ready"
                                            : "unirse-status-waiting"
                                    }`}
                                >
                                    {j.ready
                                        ? "● Listo"
                                        : "◌ Esperando"}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="unirse-estado-bar">
                        <div className="unirse-estado-dot"></div>

                        <span className="unirse-estado-text">
                            Estado: <strong>{lobby.estado}</strong>
                        </span>
                    </div>
                </>
            ) : (
                <div className="unirse-empty-state">
                    <div className="unirse-empty-icon">
                        <PiDiamondsFourLight />
                    </div>

                    <p>Esperando información del lobby</p>
                </div>
            )}
        </div>
    );
}

export default LobbyPlayersPanel;