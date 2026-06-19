import { useEffect, useRef } from "react";
import "../styles/EventLog.css";

export default function EventLog({ eventos = [], title = "EVENTOS", compact = false }) {
    const logsEndRef = useRef(null);
    const getEventLabel = (tipo) => {
        const labels = {
            owner_change: "CAMBIO DE DUEÑO",
            conquest: "CONQUISTA",
            battle_start: "BATALLA INICIADA",
            build: "CONSTRUCCIÓN",
            fleet: "MOVIMIENTO",
            battle: "BATALLA",
            eliminated: "ELIMINADO",
            elimination: "ELIMINADO",
            production: "PRODUCCIÓN",
            system: "SISTEMA",
        };
        return labels[tipo] || tipo.toUpperCase();
    };

    // Auto-scroll al final cuando hay nuevos eventos
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [eventos]);

    return (
        <div className={`event-log ${compact ? "compact" : ""}`}>
            <div className="log-header">
                <h3>{title}</h3>
                <span className="log-header-count">{eventos.length}</span>
            </div>
            <div className="log-content">
                {eventos.length === 0 ? (
                    <div className="log-empty">
                        <p>Sin eventos</p>
                    </div>
                ) : (
                    eventos.map((evento, index) => (
                        <div key={index} className={`log-item log-${evento.tipo}`}>
                            <span className="log-type">{getEventLabel(evento.tipo)}</span>
                            <span className="log-time">{evento.hora}</span>
                            <span className="log-player" style={{ color: evento.color }}>
                                {evento.jugador}
                            </span>
                            <span className="log-message">{evento.mensaje}</span>
                        </div>
                    ))
                )}
                <div ref={logsEndRef} />
            </div>
        </div>
    );
}
