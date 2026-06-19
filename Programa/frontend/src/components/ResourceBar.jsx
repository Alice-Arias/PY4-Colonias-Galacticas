import "../styles/ResourceBar.css";
import { useEffect, useMemo, useState } from "react";

export default function ResourceBar({
    playerName,
    minerales,
    energia,
    cristales,
    flotas,
    sistemasControlados,
    totalSistemas,
    porcentajeControl,
    puntajeJugador,
    posicionRanking,
    produccionTiempo,
    partidaTiempo,
    estado,
    ultimoSync,
}) {
    const [ahora, setAhora] = useState(Date.now());

    useEffect(() => {
        const intervalo = setInterval(() => setAhora(Date.now()), 1000);
        return () => clearInterval(intervalo);
    }, []);

    const syncClock = useMemo(() => {
        return new Date(ahora).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }, [ahora]);

    const syncLabel = useMemo(() => {
        if (!ultimoSync) return "esperando primer sync";

        const segundos = Math.max(0, Math.floor((ahora - ultimoSync) / 1000));
        if (segundos < 5) return "actualizado ahora";
        if (segundos < 60) return `última sync hace ${segundos}s`;

        const minutos = Math.floor(segundos / 60);
        if (minutos < 60) return `última sync hace ${minutos}m`;

        const horas = Math.floor(minutos / 60);
        return `última sync hace ${horas}h`;
    }, [ahora, ultimoSync]);

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

                <div className="resource-item">
                    <span className="resource-icon">🌌</span>
                    <span className="resource-label">Control</span>
                    <span className="resource-value">{sistemasControlados}/{totalSistemas} ({porcentajeControl}%)</span>
                </div>

                <div className="resource-item">
                    <span className="resource-icon">🏆</span>
                    <span className="resource-label">Ranking</span>
                    <span className="resource-value">#{posicionRanking} · {puntajeJugador}</span>
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

                <div className="timer-chip live">
                    <span className="time-label"><span className="sync-dot"></span> Sync en vivo</span>
                    <span className="time-value">{syncClock}</span>
                    <span className="time-subvalue">{syncLabel}</span>
                </div>
            </div>
        </div>
    );
}
