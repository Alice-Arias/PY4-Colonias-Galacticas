// ======================================================
// NOMBRE: ModalDetalles
// ENTRADA: planeta seleccionado y función para cerrar el modal
// SALIDA: modal con información detallada del sistema planetario
// RESTRICCIONES: planeta debe existir para renderizar
// OBJETIVO: mostrar información completa de un sistema al hacer clic
// ======================================================

// ==============================================================================================
// NOMBRE: ModalDetalles
// ENTRADA: planeta seleccionado y callback de cierre
// SALIDA: modal con información extendida del sistema
// RESTRICCIONES: renderiza vacío si planeta no existe
// OBJETIVO: ampliar detalle estratégico de un planeta
// ==============================================================================================
export default function ModalDetalles({ planeta, onCerrar }) {
    if (!planeta) return null;

    return (
        <div className="game-modal-backdrop" onClick={onCerrar}>
            <div className="game-modal game-details-modal" onClick={(e) => e.stopPropagation()}>
                <h3>{planeta.nombre}</h3>
                <div className="detail-modal-grid">
                    <div>
                        <span className="detail-modal-label">Propietario</span>
                        <strong>{planeta.propietario || "Neutral"}</strong>
                    </div>
                    <div>
                        <span className="detail-modal-label">Tipo</span>
                        <strong>{planeta.tipo}</strong>
                    </div>
                    <div>
                        <span className="detail-modal-label">Control</span>
                        <strong>{planeta.controladoPorUsuario ? "Tu sistema" : "No controlado"}</strong>
                    </div>
                    <div>
                        <span className="detail-modal-label">Flotas</span>
                        <strong>{planeta.flotas || 0}</strong>
                    </div>
                </div>
                <div className="detail-modal-stats">
                    <p>
                        Producción por ciclo: {planeta.produccion?.minerales || 0} minerales,{" "}
                        {planeta.produccion?.energia || 0} energía,{" "}
                        {planeta.produccion?.cristales || 0} cristales.
                    </p>
                    <p>
                        Instalaciones activas:{" "}
                        {Object.entries(planeta.instalaciones || {})
                            .map(([tipo, cantidad]) => `${tipo}: ${cantidad}`)
                            .join(" | ") || "Sin instalaciones"}
                    </p>
                </div>
                <div className="modal-actions">
                    <button className="modal-confirm" onClick={onCerrar}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
