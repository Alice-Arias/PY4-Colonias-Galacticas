// ======================================================
// NOMBRE: Costos
// ENTRADA: tipo de instalación a crear(mina, central, astillero, fortaleza)
// SALIDA: objeto con costo en minerales, energía y cristales
// RESTRICCIONES:
// - solo modificarse si no los puse a como el profe pidio o si se quiere cambiar el balance del juego
// - Cada tipo debe mantener las tres propiedades de recurso
// OBJETIVO:
// Conocer los costos de creacion del juego y tenerlos a mano
// ======================================================
const costos = {
    mina:      { minerales: 100, energia: 0,   cristales: 0   },
    central:   { minerales: 80,  energia: 50,  cristales: 200 },
    astillero: { minerales: 150, energia: 100, cristales: 10  },
    fortaleza: { minerales: 200, energia: 100, cristales: 30  },
};

// ======================================================
// NOMBRE: construir
// ENTRADA: { partida, socketId, sistemaId, tipo }
// SALIDA: { ok, error } — ok si se construyó, error si no
// RESTRICCIONES:
// - La partida activa
// - El jugador tiene que ser dueño del sistema
// - Tener recursos necesarios 
// - Elejir tipo(mina, central, astillero, fortaleza)
// OBJETIVO:
// Construir instalaciones en territorios de los jugadores
// ======================================================
function construir(partida, socketId, sistemaId, tipo) {
    const jugador = partida.jugadores.find((j) => j.id === socketId);
    if (!jugador) return { ok: false, error: "Jugador no encontrado" };

    const sistema = partida.galaxia.sistemas.find((s) => s.id === sistemaId);
    if (!sistema) return { ok: false, error: "Sistema no encontrado" };

    if (sistema.propietario !== jugador.nickname)
        return { ok: false, error: "No eres propietario de este sistema" };

    const costo = costos[tipo];
    if (!costo) return { ok: false, error: "Tipo de instalación inválido" };

    if (
        jugador.recursos.minerales < costo.minerales ||
        jugador.recursos.energia   < costo.energia   ||
        jugador.recursos.cristales < costo.cristales
    ) return { ok: false, error: "Recursos insuficientes" };

    jugador.recursos.minerales -= costo.minerales;
    jugador.recursos.energia   -= costo.energia;
    jugador.recursos.cristales -= costo.cristales;

    if (!sistema.instalaciones) sistema.instalaciones = [];
    sistema.instalaciones.push(tipo);

    return { ok: true, jugador };
}

module.exports = { construir };