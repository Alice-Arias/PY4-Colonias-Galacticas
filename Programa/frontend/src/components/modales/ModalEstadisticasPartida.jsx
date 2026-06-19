// ======================================================
// NOMBRE: ModalEstadisticasPartida
// ENTRADA: resumen final de la partida y función para cerrar
// SALIDA: modal con estadísticas finales ordenadas por posición
// RESTRICCIONES: resumenPartida debe existir para renderizar
// OBJETIVO: mostrar el cierre completo de la partida al finalizar
// ======================================================

import { useNavigate } from "react-router-dom";
import { formatearTiempo } from "../../utils/transformadores";
import { obtenerInfoTematica } from "../../utils/tematicas";

// ==============================================================================================
// NOMBRE: ModalEstadisticasPartida
// ENTRADA: resumen final y callback de cierre
// SALIDA: modal de estadísticas finales
// RESTRICCIONES: requiere resumen de partida válido
// OBJETIVO: presentar métricas de cierre al jugador
// ==============================================================================================
export default function ModalEstadisticasPartida({ resumenPartida, onCerrar }) {
    const navigate = useNavigate();

    if (!resumenPartida) return null;

    const ranking = resumenPartida.ranking || [];
    const tema = obtenerInfoTematica(resumenPartida.tematica);

    return (
        <div className="game-modal-backdrop" onClick={onCerrar}>
            <div className="game-modal game-details-modal game-stats-modal" onClick={(e) => e.stopPropagation()}>
                <h3>ESTADÍSTICAS FINALES</h3>

                <div className="detail-modal-grid">
                    <div>
                        <span className="detail-modal-label">Partida</span>
                        <strong>{resumenPartida.partidaId || "-"}</strong>
                    </div>
                    <div>
                        <span className="detail-modal-label">Galaxia</span>
                        <strong>{resumenPartida.galaxia || "-"}</strong>
                    </div>
                    <div>
                        <span className="detail-modal-label">Tiempo de juego</span>
                        <strong>{formatearTiempo(resumenPartida.tiempoJuego || 0)}</strong>
                    </div>
                    <div>
                        <span className="detail-modal-label">Ganador</span>
                        <strong>{resumenPartida.ganador || "-"}</strong>
                    </div>
                    <div>
                        <span className="detail-modal-label">Temática</span>
                        <strong>{tema.label}{tema.bonusPts > 0 ? ` (+${tema.bonusPts} ptos)` : ""}</strong>
                    </div>
                </div>

                <div className="detail-modal-stats stats-intro" style={{ marginBottom: "14px" }}>
                    <p style={{ margin: 0 }}>
                        Orden de posiciones y puntaje final según sistemas controlados, recursos y estructura.
                    </p>
                </div>

                <div className="stats-table-wrap">
                    <table className="stats-table">
                        <thead>
                            <tr>
                                <th>Posición</th>
                                <th>Puntaje</th>
                                <th>Nombre</th>
                                <th>Sistemas</th>
                                <th>Recursos</th>
                                <th>Flotas</th>
                                <th>Minas</th>
                                <th>Centros</th>
                                <th>Fortalezas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ranking.map((jugador) => (
                                <tr key={`${jugador.socketId}-${jugador.posicion}`}>
                                    <td>#{jugador.posicion}</td>
                                    <td>{jugador.puntaje}</td>
                                    <td>{jugador.nickname}</td>
                                    <td>{jugador.sistemasConquistados}</td>
                                    <td>
                                        {jugador.recursos?.minerales || 0} M / {jugador.recursos?.energia || 0} E / {jugador.recursos?.cristales || 0} C
                                    </td>
                                    <td>{jugador.flotasEnPie || 0}</td>
                                    <td>{jugador.minasEnPie || 0}</td>
                                    <td>{jugador.centrosEnPie || 0}</td>
                                    <td>{jugador.fortalezasEnPie || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="modal-actions">
                    <button
                        className="modal-cancel"
                        onClick={() => navigate("/partida-final", { state: { resumenPartida } })}
                    >
                        Ver última partida
                    </button>
                    <button className="modal-confirm" onClick={() => navigate("/")}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
