
// ==============================================================================================
// NOMBRE: formatearTiempo
// ENTRADA: segundos numéricos
// SALIDA: tiempo en formato mm:ss
// RESTRICCIONES: normaliza entrada inválida a cero
// OBJETIVO: mostrar temporizadores legibles en UI
// ==============================================================================================
export function formatearTiempo(segundos) {
    const total = Math.max(0, Math.floor(Number(segundos) || 0));
    const min = Math.floor(total / 60);
    const seg = total % 60;
    return `${min}:${String(seg).padStart(2, "0")}`;
}
// ==============================================================================================
// NOMBRE: transformarEstadoServidor
// ENTRADA: estado recibido desde backend
// SALIDA: estado adaptado al modelo del frontend
// RESTRICCIONES: maneja nulos y estructuras parciales
// OBJETIVO: unificar el shape de estado para render
// ==============================================================================================
export function transformarEstadoServidor(estado) {
    const galaxia = estado?.galaxia || {};
    return (galaxia.sistemas || []).map((sistema) => ({
        id: sistema.id,
        nombre: sistema.nombre,
        propietario: sistema.controladoPor || sistema.propietario || null,
        propietarioId: sistema.propietarioId || null,
        tipo: sistema.tipo,
        x: sistema.x,
        y: sistema.y,
        conexiones: (galaxia.rutas || [])
            .filter(([a, b]) => a === sistema.id || b === sistema.id)
            .map(([a, b]) => (a === sistema.id ? b : a)),
        produccion: sistema.produccion || { minerales: 0, energia: 0, cristales: 0 },
        recursos: sistema.recursos || { minerales: 0, energia: 0, cristales: 0 },
        flotas: sistema.flotas || 0,
        minas: sistema.minas || 0,
        centrales: sistema.centrales || 0,
        astilleros: sistema.astilleros || 0,
        fortalezas: sistema.fortalezas || 0,
        bajoAtaque: sistema.bajoAtaque || false,
    }));
}

// ==============================================================================================
// NOMBRE: getPlayerState
// ENTRADA: estado global, playerName y playerSocketId
// SALIDA: snapshot del jugador actual
// RESTRICCIONES: requiere estado transformado previamente
// OBJETIVO: extraer datos del jugador activo
// ==============================================================================================
export function getPlayerState(estado, playerName, playerSocketId) {
    const jugadores = estado?.jugadores || [];
    const porSocket = jugadores.find((item) => item.socketId === playerSocketId);
    if (porSocket) return porSocket;

    const playerNameNormalizado = String(playerName || "").trim().toLowerCase();
    const jugador = jugadores.find(
        (item) => String(item.nickname || "").trim().toLowerCase() === playerNameNormalizado
    );
    return jugador || null;
}

// ==============================================================================================
// NOMBRE: inferSelectedDetails
// ENTRADA: sistema seleccionado y estado del jugador
// SALIDA: metadatos de selección para UI
// RESTRICCIONES: soporta sistemas nulos
// OBJETIVO: derivar contexto del planeta activo
// ==============================================================================================
export function inferSelectedDetails(sistema, playerState) {
    if (!sistema) return null;

    return {
        nombre: sistema.nombre,
        propietario: sistema.propietario,
        tipo: sistema.tipo,
        produccion: sistema.produccion,
        flotas: sistema.flotas,
        instalaciones: {
            Mina: sistema.minas,
            "Central de investigación": sistema.centrales,
            "Astillero de flotas": sistema.astilleros,
            Fortaleza: sistema.fortalezas,
        },
        recursos: sistema.recursos,
        bajoAtaque: sistema.bajoAtaque,
        controladoPorUsuario: playerState?.sistemas?.includes(sistema.id),
    };
}
