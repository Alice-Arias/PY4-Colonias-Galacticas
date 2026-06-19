// ======================================================
// NOMBRE: ModalFlota
// ENTRADA: sistema origen, lista de sistemas, recursos y callbacks
// SALIDA: modal con formulario de envío de flotas y vista previa de combate
// RESTRICCIONES: sistema origen debe existir y tener flotas disponibles
// OBJETIVO: permitir al jugador mover flotas y ver estimación de combate
// ======================================================

import { calcularCostoMovimiento } from "../../utils/flotas";

function tieneRutaValida(sistemas, origenId, destinoId, propietarioOrigenId) {
    if (!origenId || !destinoId || origenId === destinoId) return false;

    const porId = new Map(sistemas.map((sistema) => [sistema.id, sistema]));
    const origen = porId.get(origenId);
    const vecinos = Array.isArray(origen?.conexiones) ? origen.conexiones : [];
    return vecinos.includes(destinoId);
}

export default function ModalFlota({
    sistemaOrigen,
    sistemas,
    formFlota,
    onChangeDestino,
    onChangeCantidad,
    onEnviar,
    onCerrar,
    onAtacar,
    ordenPendiente = false,
}) {
    if (!sistemaOrigen) return null;

    const flotasAtaque = Math.max(0, Number(formFlota.cantidad) || 0);
    const flotasRestantes = Math.max(0, (sistemaOrigen.flotas || 0) - flotasAtaque);
    const destinosValidos = sistemas.filter((sistema) => {
        if (sistema.id === sistemaOrigen.id) return false;
        const conexiones = Array.isArray(sistemaOrigen.conexiones) ? sistemaOrigen.conexiones : [];
        return conexiones.includes(sistema.id);
    });
    const costoMovimiento = calcularCostoMovimiento(flotasAtaque);
    const destinoSeleccionado = sistemas.find((s) => s.id === formFlota.destino) || null;
    const destinoHostil = Boolean(
        destinoSeleccionado && (
            (destinoSeleccionado.propietarioId && destinoSeleccionado.propietarioId !== sistemaOrigen.propietarioId)
            || (destinoSeleccionado.propietario && destinoSeleccionado.propietario !== sistemaOrigen.propietario)
        )
    );
    const destinoNeutral = Boolean(destinoSeleccionado && !destinoSeleccionado.propietarioId);
    const rutaValida = destinoSeleccionado
        ? tieneRutaValida(sistemas, sistemaOrigen.id, destinoSeleccionado.id, sistemaOrigen.propietarioId)
        : false;
    const origenBajoAtaque = Boolean(sistemaOrigen?.bajoAtaque);
    const destinoBajoAtaque = Boolean(destinoSeleccionado?.bajoAtaque);
    const flotasDisponibles = Number(sistemaOrigen.flotas || 0);
    const flotasValidas = flotasAtaque > 0 && flotasAtaque <= flotasDisponibles;
    const puedeEnviar = Boolean(destinoSeleccionado)
        && rutaValida
        && flotasValidas
        && !origenBajoAtaque
        && !destinoBajoAtaque
        && !ordenPendiente;

    let motivoBloqueo = "";
    if (!destinoSeleccionado) {
        motivoBloqueo = "Selecciona un destino para enviar flotas.";
    } else if (origenBajoAtaque) {
        motivoBloqueo = "No puedes enviar: el sistema origen está bajo ataque.";
    } else if (destinoBajoAtaque) {
        motivoBloqueo = "No puedes enviar: el sistema destino está siendo atacado.";
    } else if (!rutaValida) {
        motivoBloqueo = "No existe ruta directa válida hacia ese sistema.";
    } else if (flotasAtaque <= 0) {
        motivoBloqueo = "Debes enviar al menos 1 flota.";
    } else if (flotasAtaque > flotasDisponibles) {
        motivoBloqueo = `Flotas insuficientes: tienes ${flotasDisponibles} y pediste ${flotasAtaque}.`;
    } else if (ordenPendiente) {
        motivoBloqueo = "Hay una orden en curso. Espera confirmación del servidor.";
    }

    let diagnosticoCombate = null;
    if (destinoHostil && destinoSeleccionado) {
        const flotasAtacantes = flotasAtaque;
        const astillerosOrigen = Number(sistemaOrigen.astilleros || 0);
        const flotasDefensoras = Number(destinoSeleccionado.flotas || 0);
        const minasDefensor = Number(destinoSeleccionado.minas || 0);
        const fortalezasDefensor = Number(destinoSeleccionado.fortalezas || 0);

        const flotasNeutralizadas = Math.min(flotasAtacantes, flotasDefensoras);
        const flotasAtacantesTrasDuelo = flotasAtacantes - flotasNeutralizadas;
        const flotasDefensorasTrasDuelo = flotasDefensoras - flotasNeutralizadas;

        if (flotasDefensorasTrasDuelo > 0) {
            diagnosticoCombate = {
                exito: false,
                mensaje: `No conquistarás con ${flotasAtacantes} flotas: faltan ${flotasDefensorasTrasDuelo + 1} flotas para superar la defensa inicial.`,
            };
        } else {
            const unidadesParaMinas = Math.ceil(minasDefensor / 3);
            const astillerosNecesariosFortalezas = fortalezasDefensor * 2;
            const astillerosNecesariosExtraMinas = Math.max(0, unidadesParaMinas - flotasAtacantesTrasDuelo);
            const astillerosNecesariosTotales = astillerosNecesariosFortalezas + astillerosNecesariosExtraMinas;
            const astillerosFaltantes = Math.max(0, astillerosNecesariosTotales - astillerosOrigen);

            if (astillerosFaltantes > 0) {
                diagnosticoCombate = {
                    exito: false,
                    mensaje: `No conquistarás: faltan ${astillerosFaltantes} astilleros de apoyo para romper minas/fortalezas.`,
                };
            } else {
                diagnosticoCombate = {
                    exito: true,
                    mensaje: "Con esta fuerza, sí puedes conquistar si no cambia la defensa antes del impacto.",
                };
            }
        }
    }

    return (
        <div className="game-modal-backdrop" onClick={onCerrar}>
            <div className="game-modal" onClick={(e) => e.stopPropagation()}>
                <h3>{destinoHostil || destinoNeutral ? "CONQUISTAR SISTEMA" : "ENVIAR FLOTA"}</h3>

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
                        {destinosValidos
                            .map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.nombre}
                                </option>
                            ))}
                    </select>
                </label>

                {destinosValidos.length === 0 && (
                    <small className="modal-help" style={{ color: "#ff9c9c" }}>
                        Este planeta no tiene rutas directas disponibles para mover flotas.
                    </small>
                )}

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

                {formFlota.destino && (
                    <div className="fleet-preview">
                        <h4>{destinoHostil || destinoNeutral ? "Resumen de conquista" : "Resumen de movilización"}</h4>
                        <p>Origen: {sistemaOrigen.nombre} ({sistemaOrigen.flotas || 0} flotas)</p>
                        <p>Destino: {destinoSeleccionado?.nombre || "-"}</p>
                        {destinoHostil && (
                            <p>Gobernado por: {destinoSeleccionado?.propietario || "otro jugador"}</p>
                        )}
                        <p>Ruta disponible: {rutaValida ? "Sí" : "No"}</p>
                        <p>Origen bajo ataque: {origenBajoAtaque ? "Sí" : "No"}</p>
                        <p>Destino bajo ataque: {destinoBajoAtaque ? "Sí" : "No"}</p>
                        <p>Flotas a enviar: {flotasAtaque}</p>
                        {destinoHostil && (
                            <p>Astilleros origen: {Number(sistemaOrigen.astilleros || 0)} · Defensas destino: {Number(destinoSeleccionado?.minas || 0)} minas / {Number(destinoSeleccionado?.fortalezas || 0)} fortalezas</p>
                        )}
                        <p>
                            Costo movimiento:{" "}
                            <strong>
                                {costoMovimiento.minerales} minerales / {costoMovimiento.energia} energía / {costoMovimiento.cristales} cristales
                            </strong>
                        </p>
                    </div>
                )}

                <small className="modal-help">
                    Disponibles en origen: {sistemaOrigen.flotas || 0} flotas
                </small>
                <small className="modal-help">
                    Al enviar, quedarán {flotasRestantes} flotas en {sistemaOrigen.nombre}.
                </small>
                {destinoSeleccionado && !rutaValida && (
                    <small className="modal-help" style={{ color: "#ff9c9c" }}>
                        No hay una ruta válida hacia ese sistema. No puedes enviar ni conquistar por este camino.
                    </small>
                )}

                {motivoBloqueo ? (
                    <small className="modal-help modal-help-error">
                        {motivoBloqueo}
                    </small>
                ) : (
                    <small className="modal-help modal-help-ok">
                        Listo para enviar. El servidor debe confirmar el movimiento.
                    </small>
                )}

                {diagnosticoCombate && (
                    <small className={`modal-help ${diagnosticoCombate.exito ? "modal-help-ok" : "modal-help-error"}`}>
                        {diagnosticoCombate.mensaje}
                    </small>
                )}

                <div className="modal-actions">
                    <button
                        className="modal-confirm"
                        onClick={destinoHostil ? onAtacar : onEnviar}
                        disabled={!puedeEnviar}
                    >
                        {ordenPendiente
                            ? "Procesando..."
                            : (destinoHostil || destinoNeutral ? "Conquistar" : "Enviar Flota")}
                    </button>
                    <button className="modal-cancel" onClick={onCerrar}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
