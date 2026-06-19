// ==============================================================================================
// NOMBRE: ResumenPartida
// ENTRADA: resumen final de victoria, derrota y puntajes
// SALIDA: pantalla con el cierre de la partida
// RESTRICCIONES: conservar el estado final sin reabrir acciones
// OBJETIVO: resumir el resultado final de una partida
// ==============================================================================================
import { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import backgroundLogin from "../assets/backgroundLogin.jpeg";
import { formatearTiempo } from "../utils/transformadores";
import { obtenerInfoTematica } from "../utils/tematicas";
import "../styles/Ranking.css";

// ==============================================================================================
// NOMBRE: ResumenPartida
// ENTRADA: datos de cierre de la partida
// SALIDA: vista de resumen final
// RESTRICCIONES: depende de estado de navegación o sesión
// OBJETIVO: presentar estadísticas y resultado final
// ==============================================================================================
export default function ResumenPartida() {
    const navigate = useNavigate();
    const location = useLocation();
    const fxRef = useRef(null);

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

    const resumenPartida = useMemo(() => {
        return (
            location.state?.resumenPartida ||
            (() => {
                const guardado = sessionStorage.getItem("ultimaPartidaResumen") || localStorage.getItem("ultimaPartidaResumen");
                if (!guardado) return null;
                try {
                    return JSON.parse(guardado);
                } catch {
                    return null;
                }
            })()
        );
    }, [location.state]);

    const ranking = resumenPartida?.ranking || [];
    const tema = obtenerInfoTematica(resumenPartida?.tematica);

    return (
        <div className={`ranking-page ${tema.className}`} style={{ backgroundImage: `url(${backgroundLogin})` }}>
            <div className="ranking-bg-fx" ref={fxRef}></div>

            <div className="ranking-overlay">
                <div className="ranking-card">
                    <div className="ranking-header">
                        <span className="ranking-eyebrow">◆ Colonias Galácticas ◆</span>
                        <h1 className="ranking-title">Última partida</h1>
                    </div>

                    <div className="ranking-summary-grid">
                        <div className="ranking-summary-chip">
                            <span className="summary-label">Ganador</span>
                            <strong>{resumenPartida?.ganador || "-"}</strong>
                        </div>
                        <div className="ranking-summary-chip">
                            <span className="summary-label">Galaxia</span>
                            <strong>{resumenPartida?.galaxia || "-"}</strong>
                        </div>
                        <div className="ranking-summary-chip">
                            <span className="summary-label">Tiempo</span>
                            <strong>{formatearTiempo(resumenPartida?.tiempoJuego || 0)}</strong>
                        </div>
                    </div>

                    <div className="theme-badge" style={{ marginBottom: "0.9rem" }}>
                        Temática <strong>{tema.label}</strong>
                        {tema.bonusPts > 0 ? <span>+{tema.bonusPts} ptos</span> : null}
                    </div>

                    <p className="ranking-section-label">Datos de la partida</p>

                    <div className="ranking-summary-grid" style={{ marginBottom: "1rem" }}>
                        <div className="ranking-summary-chip">
                            <span className="summary-label">Identificador</span>
                            <strong>{resumenPartida?.partidaId || "-"}</strong>
                        </div>
                        <div className="ranking-summary-chip">
                            <span className="summary-label">Sistemas controlados</span>
                            <strong>{resumenPartida?.sistemasControlados || 0}</strong>
                        </div>
                        <div className="ranking-summary-chip">
                            <span className="summary-label">Recursos acumulados</span>
                            <strong>
                                {resumenPartida?.recursosAcumulados?.minerales || 0} M / {resumenPartida?.recursosAcumulados?.energia || 0} E / {resumenPartida?.recursosAcumulados?.cristales || 0} C
                            </strong>
                        </div>
                    </div>

                    <p className="ranking-section-label">Clasificación final</p>

                    {ranking.length > 0 ? (
                        <div className="ranking-list ranking-table-wrap">
                            <table className="ranking-table">
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
                                    {ranking.map((jugador, index) => (
                                        <tr key={`${jugador.socketId || jugador.nickname}-${jugador.posicion || index}`}>
                                            <td className={`ranking-pos ${index === 0 ? "pos-1" : index === 1 ? "pos-2" : index === 2 ? "pos-3" : "pos-n"}`}>#{jugador.posicion || index + 1}</td>
                                            <td className={`ranking-score ${index === 0 ? "gold" : ""}`}>{jugador.puntaje}</td>
                                            <td className={`ranking-name ${index < 3 ? "top-name" : ""}`}>{jugador.nickname}</td>
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
                    ) : (
                        <div className="ranking-empty-state">
                            <p>No hay información de la última partida disponible.</p>
                        </div>
                    )}

                    <button className="ranking-btn-back" onClick={() => navigate("/ranking")}>
                        Ver histórico
                    </button>
                </div>
            </div>
        </div>
    );
}