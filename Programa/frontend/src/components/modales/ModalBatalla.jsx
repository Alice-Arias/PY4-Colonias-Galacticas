// ======================================================
// NOMBRE: ModalBatalla
// ENTRADA: evento de batalla (inicio o resultado) y función para cerrar
// SALIDA: modal con información del combate en curso o finalizado
// RESTRICCIONES: eventoBatalla debe existir para renderizar
// OBJETIVO: notificar a los jugadores sobre combates en tiempo real
// ======================================================

export default function ModalBatalla({ eventoBatalla, onCerrar }) {
    if (!eventoBatalla) return null;

    return (
        <div className="game-modal-backdrop" onClick={onCerrar}>
            <div className="game-modal game-battle-modal" onClick={(e) => e.stopPropagation()}>
                {eventoBatalla.tipo === "inicio" ? (
                    <>
                        <h3>BATALLA EN {eventoBatalla.sistemaNombre}</h3>
                        <p>{eventoBatalla.atacante} ataca a {eventoBatalla.defensor}</p>
                        <p>Flotas atacantes: {eventoBatalla.flotasAtacantes}</p>
                        <p>Defensa total: {eventoBatalla.defensa?.flotas || 0}</p>
                    </>
                ) : (
                    <>
                        <h3>RESULTADO DE BATALLA</h3>
                        <p>Ganador: {eventoBatalla.ganador}</p>
                        <p>Derrotado: {eventoBatalla.derrotado || "-"}</p>
                        <p>Sistema: {eventoBatalla.sistemaNombre}</p>
                        <p>Flotas restantes: {eventoBatalla.flotasRestantes || 0}</p>
                        {eventoBatalla.planetaConquistado && (
                            <p>
                                Conquistador del planeta:{" "}
                                {eventoBatalla.conquistador || eventoBatalla.ganador}
                            </p>
                        )}
                    </>
                )}
                <div className="modal-actions">
                    <button className="modal-confirm" onClick={onCerrar}>
                        Ver detalles
                    </button>
                </div>
            </div>
        </div>
    );
}