// ==============================================================================================
// NOMBRE: EventLog
// ENTRADA: lista de eventos recientes emitidos por la partida
// SALIDA: historial visual de acciones y mensajes
// RESTRICCIONES: mantener el orden temporal y limitar ruido visual
// OBJETIVO: mostrar el historial reciente de eventos del juego
// ==============================================================================================
import { useEffect, useRef } from "react";
import "../styles/EventLog.css";

// ==============================================================================================
// NOMBRE: EventLog
// ENTRADA: lista de eventos y opciones de visualización
// SALIDA: panel de historial cronológico
// RESTRICCIONES: ordena por timestamp de llegada
// OBJETIVO: mostrar actividad reciente del juego
// ==============================================================================================
export default function EventLog({ eventos = [], title = "EVENTOS", compact = false }) {
    const logsEndRef = useRef(null);
    // ==============================================================================================
    // NOMBRE: getEventLabel
    // ENTRADA: tipo de evento
    // SALIDA: etiqueta legible para UI
    // RESTRICCIONES: usa fallback para tipos desconocidos
    // OBJETIVO: estandarizar nombres visuales del log
    // ==============================================================================================
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
