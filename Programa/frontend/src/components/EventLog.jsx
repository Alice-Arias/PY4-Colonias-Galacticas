import { useEffect, useRef } from "react";
import "../styles/EventLog.css";

export default function EventLog({ eventos = [] }) {
    const logsEndRef = useRef(null);

    // Auto-scroll al final cuando hay nuevos eventos
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [eventos]);

    return (
        <div className="event-log">
            <div className="log-header">
                <h3>EVENTOS</h3>
                <button className="log-header-btn" type="button">Ver todo</button>
            </div>
            <div className="log-content">
                {eventos.length === 0 ? (
                    <div className="log-empty">
                        <p>Sin eventos</p>
                    </div>
                ) : (
                    eventos.map((evento, index) => (
                        <div key={index} className={`log-item log-${evento.tipo}`}>
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
