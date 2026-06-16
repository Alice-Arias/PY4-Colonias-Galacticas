// ======================================================
// NOMBRE: transformadores
// ENTRADA: estado del servidor, datos de jugador y sistema
// SALIDA: estructuras para el frontend
// OBJETIVO: centralizar transformaciones de datos entre servidor y UI
// ======================================================

// ======================================================
// NOMBRE: formatearTiempo
// ENTRADA: segundos como número
// SALIDA: string en formato "mm:ss"
// RESTRICCIONES: segundos debe ser un número positivo
// OBJETIVO: convertir segundos a formato legible para el temporizador
// ======================================================
export function formatearTiempo(segundos) {
    const total = Math.max(0, Math.floor(Number(segundos) || 0));
    const min = Math.floor(total / 60);
    const seg = total % 60;
    return `${min}:${String(seg).padStart(2, "0")}`;
}

// ======================================================
// NOMBRE: transformarEstadoServidor
// ENTRADA: estado completo del servidor con galaxia y sistemas
// SALIDA: arreglo de sistemas con conexiones y datos listos para el mapa
// RESTRICCIONES: estado debe contener galaxia con sistemas y rutas
// OBJETIVO: adaptar el estado del servidor al formato que necesita GalaxyMap
// ======================================================
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

// ======================================================
// NOMBRE: getPlayerState
// ENTRADA: estado del servidor, nombre del jugador y socketId
// SALIDA: objeto con estado del jugador o null si no se encuentra
// RESTRICCIONES: busca primero por socketId, luego por nickname
// OBJETIVO: obtener el estado del jugador actual de forma segura
// ======================================================
export function getPlayerState(estado, playerName, playerSocketId) {
    const jugadores = estado?.jugadores || [];
    const porSocket = jugadores.find((item) => item.socketId === playerSocketId);
    if (porSocket) return porSocket;

    const jugador = jugadores.find((item) => item.nickname === playerName);
    return jugador || null;
}

// ======================================================
// NOMBRE: inferSelectedDetails
// ENTRADA: sistema seleccionado y estado del jugador actual
// SALIDA: objeto con detalles del sistema listos para PlanetPanel
// RESTRICCIONES: sistema debe existir
// OBJETIVO: preparar la información del sistema para mostrar en el panel lateral
// ======================================================
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
            "Centro Investigación": sistema.centrales,
            Astillero: sistema.astilleros,
            Fortaleza: sistema.fortalezas,
        },
        recursos: sistema.recursos,
        bajoAtaque: sistema.bajoAtaque,
        controladoPorUsuario: playerState?.sistemas?.includes(sistema.id),
    };
}