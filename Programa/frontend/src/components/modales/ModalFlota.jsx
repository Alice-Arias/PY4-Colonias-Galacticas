// ======================================================
// NOMBRE: ModalFlota
// ENTRADA: sistema origen, lista de sistemas, recursos y callbacks
// SALIDA: modal con formulario de envío de flotas y vista previa de combate
// RESTRICCIONES: sistema origen debe existir y tener flotas disponibles
// OBJETIVO: permitir al jugador mover flotas y ver estimación de combate
// ======================================================

import {
    calcularDefensaEstimada,
    calcularCostoMovimiento,
    calcularBalanceCombate,
    esCombateDirecto,
} from "../../utils/combate";

export default function ModalFlota({
    sistemaOrigen,
    sistemas,
    formFlota,
    onChangeDestino,
    onChangeCantidad,
    onEnviar,
    onCerrar,
}) {
    if (!sistemaOrigen) return null;

    const destinoSeleccionado = sistemas.find((s) => s.id === formFlota.destino) || null;
    const flotasAtaque = Math.max(0, Number(formFlota.cantidad) || 0);
    const defensaEstimada = calcularDefensaEstimada(destinoSeleccionado);
    const costoMovimiento = calcularCostoMovimiento(flotasAtaque);
    const balanceCombate = calcularBalanceCombate(flotasAtaque, defensaEstimada);
    const combateDirecto = esCombateDirecto(sistemaOrigen, destinoSeleccionado);

    return (
        <div className="game-modal-backdrop" onClick={onCerrar}>
            <div className="game-modal" onClick={(e) => e.stopPropagation()}>
                <h3>ENVIAR FLOTA</h3>

                <label>
                    Desde
                    <input value={sistemaOrigen.nombre} readOnly />
                </label>

                <label>
                    Destino
                    <select
                        value={formFlota.destino}
                        onChange={(e) => onChangeDestino(e.target.value)}
                    >
                        <option value="">Seleccionar destino</option>
                        {sistemas
                            .filter((s) => s.id !== sistemaOrigen.id)
                            .map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.nombre}
                                </option>
                            ))}
                    </select>
                </label>

                <label>
                    Flotas a enviar
                    <input
                        type="number"
                        min="1"
                        max={Math.max(1, sistemaOrigen.flotas || 1)}
                        value={formFlota.cantidad}
                        onChange={(e) => onChangeCantidad(e.target.value)}
                    />
                </label>

                {destinoSeleccionado && (
                    <div className="fleet-preview">
                        <h4>Vista previa de envío</h4>
                        <p>Origen: {sistemaOrigen.nombre} ({sistemaOrigen.flotas || 0} flotas)</p>
                        <p>Destino: {destinoSeleccionado.nombre}</p>
                        <p>Flotas a enviar: {flotasAtaque}</p>
                        <p>
                            Costo movimiento:{" "}
                            <strong>
                                {costoMovimiento.minerales} minerales / {costoMovimiento.energia} energía / {costoMovimiento.cristales} cristales
                            </strong>
                        </p>
                        {combateDirecto ? (
                            <>
                                <p>Defensa estimada destino: {defensaEstimada}</p>
                                <p className={balanceCombate >= 0 ? "preview-favorable" : "preview-risk"}>
                                    {balanceCombate >= 0
                                        ? `Ventaja estimada: +${balanceCombate} para el ataque`
                                        : `Riesgo estimado: ${Math.abs(balanceCombate)} por debajo de la defensa`}
                                </p>
                            </>
                        ) : (
                            <p className="preview-favorable">
                                No hay combate directo estimado en este envío.
                            </p>
                        )}
                    </div>
                )}

                <small className="modal-help">
                    Disponibles en origen: {sistemaOrigen.flotas || 0} flotas
                </small>
                <small className="modal-help">
                    Solo puedes enviar si la ruta es válida y el sistema no está siendo atacado.
                </small>

                <div className="modal-actions">
                    <button className="modal-confirm" onClick={onEnviar}>
                        Enviar Flota
                    </button>
                    <button className="modal-cancel" onClick={onCerrar}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
