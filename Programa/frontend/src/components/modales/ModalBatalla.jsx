
// ==============================================================================================
// NOMBRE: ModalBatalla
// ENTRADA: datos del evento de batalla y callback de cierre
// SALIDA: modal informativo de combate
// RESTRICCIONES: requiere evento válido para render útil
// OBJETIVO: mostrar resolución de enfrentamientos
// ==============================================================================================
export default function ModalBatalla({ eventoBatalla, onCerrar }) {
    if (!eventoBatalla) return null;

    const esInicio = eventoBatalla.tipo === "inicio";
    const atacante = eventoBatalla.atacante || "Atacante";
    const defensor = eventoBatalla.defensor || "Defensor";
    const sistemaNombre = eventoBatalla.sistemaNombre || "Sistema";

    return (
        <div className="battle-toast-container" role="status" aria-live="polite">
            <div className="game-modal game-battle-modal battle-toast" onClick={(e) => e.stopPropagation()}>
                {esInicio ? (
                    <>
                        <h3>BATALLA EN {sistemaNombre}</h3>
                        <p><strong>{atacante}</strong> ataca a <strong>{defensor}</strong></p>
                        <div style={{ marginTop: "10px", lineHeight: "1.8" }}>
                            <p>Flotas atacantes: {eventoBatalla.flotasAtacantes}</p>
                            <p>Astilleros de apoyo (origen): {eventoBatalla.astillerosApoyo || 0}</p>
                            <p>Astilleros mínimos para conquistar: {eventoBatalla.defensa?.astillerosMinimosParaConquistar || 0}</p>
                            <p style={{ fontSize: "0.9em", color: "#aaa" }}>
                                Defensor: {eventoBatalla.defensa?.flotas || 0} flotas / {eventoBatalla.defensa?.minas || 0} minas / {eventoBatalla.defensa?.fortalezas || 0} fortalezas
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <h3>RESULTADO DE BATALLA</h3>
                        <div style={{ marginTop: "15px", lineHeight: "2" }}>
                            <p><strong>{atacante}</strong> ataca a <strong>{defensor}</strong></p>
                            <p>Sistema: <strong>{sistemaNombre}</strong></p>
                            <hr style={{ borderColor: "#444", margin: "10px 0" }} />
                            <p>Flotas atacantes: {eventoBatalla.flotasAtacantes || 0}</p>
                            <p>Astilleros atacantes disponibles: {eventoBatalla.astillerosAtacantesDisponibles || 0}</p>
                            <p>Astilleros atacantes usados: {eventoBatalla.astillerosAtacantesUsados || 0}</p>
                            <p>Defensa total: {eventoBatalla.defensaTotal || 0}</p>
                            <p>Flotas restantes: <strong style={{ color: eventoBatalla.ataqueGana ? "#00ff88" : "#ff6b6b" }}>{eventoBatalla.flotasRestantes || 0}</strong></p>
                            <hr style={{ borderColor: "#444", margin: "10px 0" }} />
                            <p>Bajas defensoras: {eventoBatalla.flotasDefensorasPerdidas || 0} flotas / {eventoBatalla.minasPerdidas || 0} minas / {eventoBatalla.fortalezasPerdidas || 0} fortalezas</p>
                            <hr style={{ borderColor: "#444", margin: "10px 0" }} />
                            <p><strong style={{ fontSize: "1.1em", color: eventoBatalla.ataqueGana ? "#00ff88" : "#ff6b6b" }}>
                                GANADOR: {eventoBatalla.ganador || "-"}
                            </strong></p>
                            {eventoBatalla.planetaConquistado && (
                                <p style={{ color: "#00ff88", marginTop: "10px" }}>
                                    ✓ Planeta conquistado por {eventoBatalla.conquistador || eventoBatalla.ganador}
                                </p>
                            )}
                        </div>
                    </>
                )}
                <div className="modal-actions">
                    <button className="modal-confirm" onClick={onCerrar}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
