import "../styles/ResourceBar.css";

export default function ResourceBar({
    playerName,
    minerales,
    energia,
    cristales,
    flotas,
    produccionTiempo,
    partidaTiempo,
    estado
}) {
    return (
        <div className="resource-bar">
            <div className="player-block">
                <span className="player-label">Jugador</span>
                <span className="player-name">{playerName}</span>
                <span className={`phase-pill phase-${estado}`}>{estado === "activo" ? "En juego" : estado === "countdown" ? "Preparando" : "Conectando"}</span>
            </div>

            <div className="resources-container">
                <div className="resource-item">
                    <span className="resource-icon">⛏️</span>
                    <span className="resource-label">Minerales</span>
                    <span className="resource-value">{minerales}</span>
                </div>

                <div className="resource-item">
                    <span className="resource-icon">⚡</span>
                    <span className="resource-label">Energía</span>
                    <span className="resource-value">{energia}</span>
                </div>

                <div className="resource-item">
                    <span className="resource-icon">💎</span>
                    <span className="resource-label">Cristales</span>
                    <span className="resource-value">{cristales}</span>
                </div>

                <div className="resource-item">
                    <span className="resource-icon">🚀</span>
                    <span className="resource-label">Flotas</span>
                    <span className="resource-value">{flotas}</span>
                </div>
            </div>

            <div className="timer-stack">
                <div className="timer-chip primary">
                    <span className="time-label">Partida</span>
                    <span className="time-value">{partidaTiempo}</span>
                </div>

                <div className="timer-chip">
                    <span className="time-label">Producción</span>
                    <span className="time-value">{produccionTiempo}</span>
                </div>

                <div className="settings-icon">
                    <span>⚙️</span>
                </div>
            </div>
        </div>
    );
}
