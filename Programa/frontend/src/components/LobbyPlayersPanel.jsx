// ==============================================================================================
// NOMBRE: LobbyPlayersPanel
// ENTRADA: jugadores conectados en la sala
// SALIDA: panel con la lista de participantes
// RESTRICCIONES: reflejar el estado del lobby sin modificarlo
// OBJETIVO: listar los jugadores conectados en la sala
// ==============================================================================================
import { PiDiamondsFourLight } from "react-icons/pi";
import "../styles/LobbyPlayersPanel.css";

// ==============================================================================================
// NOMBRE: LobbyPlayersPanel
// ENTRADA: estado de lobby y partidaId
// SALIDA: listado de jugadores conectados
// RESTRICCIONES: usa fallback cuando no hay jugadores
// OBJETIVO: mostrar participantes presentes en sala
// ==============================================================================================
function LobbyPlayersPanel({ lobby, partidaId }) {

    const getAvatarSticker = () => "🧑‍🚀";

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
                                <div
                                    className="unirse-player-avatar"
                                    title={j.nickname}
                                    aria-label={`Astronauta de ${j.nickname}`}
                                >
                                    <span className="unirse-player-avatar-sticker">
                                        {getAvatarSticker()}
                                    </span>
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