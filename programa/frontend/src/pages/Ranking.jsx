// ==============================================================================================
// NOMBRE: Ranking
// ENTRADA: datos agregados de partidas y jugadores
// SALIDA: clasificación visible para el usuario
// RESTRICCIONES: ordenar y mostrar puntajes sin alterar el historial
// OBJETIVO: presentar el ranking de partidas y jugadores
// ==============================================================================================
import "../styles/Ranking.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import backgroundLogin from "../assets/backgroundLogin.jpeg";
import { formatearTiempo } from "../utils/transformadores";
import api from "../services/api";
import { obtenerInfoTematica } from "../utils/tematicas";

const ROW_CLASS = { 0: "top-1", 1: "top-2", 2: "top-3" };

// ==============================================================================================
// NOMBRE: Ranking
// ENTRADA: historial de resultados de partidas
// SALIDA: tabla ordenada de puntajes y desempeño
// RESTRICCIONES: lectura únicamente
// OBJETIVO: mostrar clasificación histórica
// ==============================================================================================
export default function Ranking() {
    const navigate = useNavigate();
    const location = useLocation();
    const fxRef = useRef(null);
    const [historial, setHistorial] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

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

    const ultimaPartida = historial[0] || resumenPartida || null;
    const temaUltimaPartida = obtenerInfoTematica(ultimaPartida?.tematica);

    useEffect(() => {
        let activo = true;

        api.get("/ranking/historico")
            .then((response) => {
                if (!activo) return;
                setHistorial(Array.isArray(response.data?.historial) ? response.data.historial : []);
                setError("");
            })
            .catch(() => {
                if (!activo) return;
                setError("No se pudo cargar el historial de partidas.");
                setHistorial([]);
            })
            .finally(() => {
                if (!activo) return;
                setCargando(false);
            });

        return () => {
            activo = false;
        };
    }, []);

    return (
        <div
            className={`ranking-page ${temaUltimaPartida.className}`}
            style={{ backgroundImage: `url(${backgroundLogin})` }}
        >
            <div className="ranking-bg-fx" ref={fxRef}></div>

            <div className="ranking-overlay">
                <div className="ranking-card">

                    <div className="ranking-header">
                        <span className="ranking-eyebrow">◆ Colonias Galácticas ◆</span>
                        <h1 className="ranking-title">Histórico de partidas</h1>
                    </div>

                    <div className="ranking-summary-grid">
                        <div className="ranking-summary-chip">
                            <span className="summary-label">Partidas registradas</span>
                            <strong>{historial.length}</strong>
                        </div>
                        <div className="ranking-summary-chip">
                            <span className="summary-label">Último ganador</span>
                            <strong>{ultimaPartida?.ganador || "-"}</strong>
                        </div>
                        <div className="ranking-summary-chip">
                            <span className="summary-label">Última galaxia</span>
                            <strong>{ultimaPartida?.galaxia || "-"}</strong>
                        </div>
                    </div>

                    <div className="theme-badge" style={{ marginBottom: "0.9rem" }}>
                        Última temática <strong>{temaUltimaPartida.label}</strong>
                        {temaUltimaPartida.bonusPts > 0 ? <span>+{temaUltimaPartida.bonusPts} ptos</span> : null}
                    </div>

                    <p className="ranking-section-label">Ganadores de cada partida</p>

                    {cargando ? (
                        <div className="ranking-empty-state">
                            <p>Cargando historial...</p>
                        </div>
                    ) : error ? (
                        <div className="ranking-empty-state">
                            <p>{error}</p>
                        </div>
                    ) : historial.length > 0 ? (
                        <div className="ranking-list ranking-table-wrap">
                            <table className="ranking-table">
                                <thead>
                                    <tr>
                                        <th>Ganador</th>
                                        <th>Sistemas controlados</th>
                                        <th>Recursos</th>
                                        <th>Galaxia</th>
                                        <th>Temática</th>
                                        <th>Tiempo</th>
                                        <th>Partida</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historial.map((partida, index) => (
                                        <tr key={`${partida.partidaId || index}-${partida.tiempoFinalizacion || index}`} className={ROW_CLASS[index] ?? ""}>
                                            <td className={`ranking-name ${index < 3 ? "top-name" : ""}`}>{partida.ganador}</td>
                                            <td className={`ranking-score ${index === 0 ? "gold" : ""}`}>{partida.sistemasControlados || 0}</td>
                                            <td>
                                                {partida.recursosAcumulados?.minerales || 0} M / {partida.recursosAcumulados?.energia || 0} E / {partida.recursosAcumulados?.cristales || 0} C
                                            </td>
                                            <td>{partida.galaxia}</td>
                                            <td>{obtenerInfoTematica(partida.tematica).label}</td>
                                            <td>{formatearTiempo(partida.tiempoJuego || 0)}</td>
                                            <td>{partida.partidaId}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="ranking-empty-state">
                            <p>No hay partidas finalizadas registradas todavía.</p>
                            <p>Cuando termine una partida, aparecerá aquí el historial de ganadores.</p>
                        </div>
                    )}

                    <button className="ranking-btn-back" onClick={() => navigate("/")}>
                        Volver al inicio
                    </button>

                </div>
            </div>
        </div>
    );
}