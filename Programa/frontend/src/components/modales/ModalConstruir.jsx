// ======================================================
// NOMBRE: ModalConstruir
// ENTRADA: sistema seleccionado, recursos del jugador, tipo seleccionado y callbacks
// SALIDA: modal con opciones de construcción y validar recursos
// RESTRICCIONES: sistema debe existir y el juego debe estar iniciado
// OBJETIVO: permitir al jugador construir instalaciones en sus sistemas
// ======================================================

import { getCostosTexto, getCostoConstruccion, puedeConstruir } from "../../utils/combate";

const COSTOS_TEXTO = getCostosTexto();

export default function ModalConstruir({
    sistema,
    recursos,
    tipoSeleccionado,
    onChangeTipo,
    onConstruir,
    onCerrar,
}) {
    if (!sistema) return null;

    const costo = getCostoConstruccion(tipoSeleccionado);
    const puedeconstruir = puedeConstruir(tipoSeleccionado, recursos);

    return (
        <div className="game-modal-backdrop" onClick={onCerrar}>
            <div className="game-modal" onClick={(e) => e.stopPropagation()}>
                <h3>CONSTRUIR EN {sistema.nombre}</h3>

                <div className="modal-list">
                    {Object.entries(COSTOS_TEXTO).map(([tipo, costoTexto]) => (
                        <button
                            key={tipo}
                            className={`modal-option ${tipoSeleccionado === tipo ? "active" : ""}`}
                            onClick={() => onChangeTipo(tipo)}
                        >
                            <span>
                                {tipo === "central"
                                    ? "Centro de Investigación"
                                    : tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                            </span>
                            <small>{costoTexto}</small>
                        </button>
                    ))}
                </div>

                <small className="modal-help">
                    Recursos actuales: {recursos.minerales} minerales / {recursos.energia} energía / {recursos.cristales} cristales
                </small>
                <small className="modal-help">
                    Costo seleccionado: {costo.minerales} minerales / {costo.energia} energía / {costo.cristales} cristales
                </small>

                {!puedeconstruir && (
                    <small className="modal-help" style={{ color: "#ff9c9c" }}>
                        Recursos insuficientes para esta construcción.
                    </small>
                )}

                <div className="modal-actions">
                    <button
                        className="modal-confirm"
                        onClick={onConstruir}
                        disabled={!puedeconstruir}
                    >
                        Construir
                    </button>
                    <button className="modal-cancel" onClick={onCerrar}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
