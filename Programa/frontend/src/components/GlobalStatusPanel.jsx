// ==============================================================================================
// NOMBRE: GlobalStatusPanel
// ENTRADA: datos globales del jugador y la partida
// SALIDA: panel de estado general visible en juego
// RESTRICCIONES: mostrar solo datos agregados y relevantes
// OBJETIVO: mostrar el estado global del jugador y la partida
// ==============================================================================================
import "../styles/GlobalStatusPanel.css";

// ==============================================================================================
// NOMBRE: GlobalStatusPanel
// ENTRADA: métricas globales de partida y jugador
// SALIDA: panel de estado resumido
// RESTRICCIONES: solo presentación
// OBJETIVO: mostrar indicadores estratégicos clave
// ==============================================================================================
export default function GlobalStatusPanel({
    topJugadores = [],
    metaVictoriaPorcentaje = 60,
    metaVictoriaSistemas = 1,
    totalSistemas = 1,
    jugadoresActivos = 0,
    sistemasControlados = 0,
    porcentajeControl = 0,
    puntajeJugador = 0,
    posicionRanking = 1,
}) {
    const progresoMeta = Math.max(0, Math.min(100, Math.round((sistemasControlados / Math.max(1, metaVictoriaSistemas)) * 100)));

    return (
        <aside className="global-status-panel">
            <header className="global-status-header">
                <h3>Estado global</h3>
                <span className="global-status-subtitle">Top 5 en tiempo real</span>
            </header>

            <div className="global-meta-card">
                <p className="global-meta-title">Resumen rapido</p>
                <p className="global-meta-value">
                    {metaVictoriaPorcentaje}% ({metaVictoriaSistemas}/{totalSistemas} sistemas)
                </p>
                <div className="global-progress-track">
                    <div className="global-progress-fill" style={{ width: `${progresoMeta}%` }}></div>
                </div>
                <p className="global-progress-text">
                    Avance: {sistemasControlados} sistemas ({porcentajeControl}%)
                </p>
                <p className="global-progress-text">Activos: {jugadoresActivos} jugadores</p>
            </div>

            <div className="global-player-card">
                <div>
                    <span className="global-label">Tu posicion</span>
                    <strong>#{posicionRanking}</strong>
                </div>
                <div>
                    <span className="global-label">Tu puntaje</span>
                    <strong>{puntajeJugador}</strong>
                </div>
            </div>

            <div className="global-ranking-list">
                {topJugadores.length > 0 ? (
                    topJugadores.map((jugador) => (
                        <div key={`${jugador.nickname}-${jugador.posicion}`} className="global-ranking-row">
                            <span className="rank-pos">#{jugador.posicion}</span>
                            <span className="rank-name">{jugador.nickname}</span>
                            <span className="rank-systems">{jugador.sistemasControlados} ({jugador.porcentajeControl}%)</span>
                            <span className="rank-score">{jugador.puntaje}</span>
                        </div>
                    ))
                ) : (
                    <p className="global-empty">Esperando datos de ranking...</p>
                )}
            </div>
        </aside>
    );
}
