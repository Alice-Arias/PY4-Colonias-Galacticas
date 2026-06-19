import "../styles/PlanetPanel.css";

export default function PlanetPanel({ planeta, esBaseInicial = false, esPropio = false, onBuild, onSendFleet, onDetails, ultimoSync }) {
    if (!planeta) {
        return (
            <div className="planet-panel">
                <div className="planet-empty">
                    <p>Selecciona un nodo para ver su información</p>
                </div>
            </div>
        );
    }

    const { nombre, propietario, produccion, flotas, tipo, recursos, bajoAtaque } = planeta;

    return (
        <div className="planet-panel">
            <div className="planet-header">
                <div className="planet-image">
                    <span className="planet-emoji">🪐</span>
                </div>
                <div className="planet-info">
                    <div className="planet-title-row">
                        <h3 className="planet-name">{nombre}</h3>
                        {esBaseInicial && <span className="planet-badge">BASE</span>}
                    </div>
                    <p className="planet-owner">{propietario ? `Propietario: ${propietario}` : "Sistema sin control"}</p>
                    <div className="planet-status-row">
                        <span className={`planet-status ${esPropio ? "is-own" : ""}`}>{esPropio ? "Tu nodo" : "Nodo ajeno"}</span>
                        {bajoAtaque && <span className="planet-status danger">Bajo ataque</span>}
                    </div>
                </div>
            </div>

            <div className="planet-details">
                <div className="overview-strip">
                    <div>
                        <span className="overview-label">Tipo</span>
                        <strong>{tipo}</strong>
                    </div>
                    <div>
                        <span className="overview-label">Stock local</span>
                        <strong>{recursos?.minerales || 0} / {recursos?.energia || 0} / {recursos?.cristales || 0}</strong>
                    </div>
                    <div>
                        <span className="overview-label">Flotas</span>
                        <strong>{flotas || 0}</strong>
                    </div>
                </div>

                <div className="detail-section">
                    <h4>Producción (cada 20s)</h4>
                    <div className="production-grid">
                        <div className="prod-item">
                            <span className="prod-icon">⛏️</span>
                            <span className="prod-value">{produccion?.minerales || 35}</span>
                        </div>
                        <div className="prod-item">
                            <span className="prod-icon">⚡</span>
                            <span className="prod-value">{produccion?.energia || 35}</span>
                        </div>
                        <div className="prod-item">
                            <span className="prod-icon">💎</span>
                            <span className="prod-value">{produccion?.cristales || 0}</span>
                        </div>
                    </div>
                </div>

                <div className="detail-section">
                    <h4>Flotas del sistema</h4>
                    <div className="status-grid status-grid-single">
                        <div className="status-item">
                            <span className="status-label">Unidades disponibles</span>
                            <span className="status-value">{flotas || 0}</span>
                        </div>
                    </div>
                    <p className="modal-help" style={{ marginTop: "0.6rem" }}>
                        Cuando envías flotas, se descuentan de este sistema. Los astilleros las reponen con el tiempo.
                    </p>
                </div>

                <div className="action-buttons">
                    <button
                        className="btn btn-construct"
                        onClick={onBuild}
                        title="Construir instalaciones"
                        disabled={!esPropio}
                    >
                        CONSTRUIR
                    </button>
                    <button
                        className="btn btn-fleet"
                        onClick={onSendFleet}
                        title="Enviar flota"
                        disabled={!esPropio}
                    >
                        ENVIAR FLOTA
                    </button>
                    <button
                        className="btn btn-details"
                        onClick={onDetails}
                        title="Ver detalles"
                    >
                        DETALLES
                    </button>
                </div>
            </div>
        </div>
    );
}
