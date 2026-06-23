// ======================================================
// NOMBRE: Construcciones
// ENTRADA: datos del jugador, sistema destino y tipo de edificio
// SALIDA: resultado de éxito/error de la construcción
// OBJETIVO: validar y ejecutar construcción de infraestructura
// ======================================================

const COSTOS_CONSTRUCCION = {
    mina:      { minerales: 100, energia: 0,   cristales: 0   },
    central:   { minerales: 80,  energia: 50,  cristales: 200 },
    astillero: { minerales: 150, energia: 100, cristales: 10  },
    fortaleza: { minerales: 200, energia: 100, cristales: 30  },
};

class GestorConstrucciones {
    constructor(sistemas, jugadores) {
        this.sistemas = sistemas;
        this.jugadores = jugadores;
    }

    // ======================================================
    // NOMBRE: construir
    // ENTRADA: socketId del jugador, sistemaId destino, tipoEdificio
    // SALIDA: objeto { exito, mensaje } con resultado de la operación
    // RESTRICCIONES: sistema debe ser propio, recursos suficientes, sin ataque activo
    // OBJETIVO: ampliar infraestructura del jugador en sus sistemas
    // ======================================================
    construir(socketId, sistemaId, tipoEdificio, inicioHabilitado) {
        const jugador = this.jugadores.get(socketId);
        const sistema = this.sistemas.get(sistemaId);

        if (!jugador) {
            return { exito: false, mensaje: "Jugador no encontrado" };
        }

        if (!inicioHabilitado) {
            return { exito: false, mensaje: "Presiona U para iniciar la partida" };
        }

        if (!sistema) {
            return { exito: false, mensaje: "Sistema no encontrado" };
        }

        if (sistema.propietarioId !== socketId) {
            return {
                exito: false,
                mensaje: `Solo puedes construir en sistemas propios (${sistema.nombre} pertenece a ${sistema.propietario || "nadie"})`,
            };
        }

        if (sistema.bajoAtaque) {
            return { exito: false, mensaje: "El sistema está siendo atacado" };
        }

        const costo = COSTOS_CONSTRUCCION[tipoEdificio];
        if (!costo) {
            return { exito: false, mensaje: `Tipo de edificio inválido: ${tipoEdificio}` };
        }

        const tieneRecursos =
            jugador.recursos.minerales >= costo.minerales &&
            jugador.recursos.energia >= costo.energia &&
            jugador.recursos.cristales >= costo.cristales;

        if (!tieneRecursos) {
            return {
                exito: false,
                mensaje: `Recursos insuficientes para ${tipoEdificio}. Se ocupan ${costo.minerales}M/${costo.energia}E/${costo.cristales}C y tienes ${jugador.recursos.minerales}M/${jugador.recursos.energia}E/${jugador.recursos.cristales}C`,
            };
        }

        // Descontar recursos del jugador
        jugador.recursos.minerales -= costo.minerales;
        jugador.recursos.energia   -= costo.energia;
        jugador.recursos.cristales -= costo.cristales;

        // Agregar edificio
        if (tipoEdificio === "mina")      sistema.minas      += 1;
        if (tipoEdificio === "central")   sistema.centrales  += 1;
        if (tipoEdificio === "astillero") sistema.astilleros += 1;
        if (tipoEdificio === "fortaleza") sistema.fortalezas += 1;

        return {
            exito: true,
            mensaje: `${tipoEdificio} construido en ${sistema.nombre}`,
            sistema: sistema.nombre,
            tipoEdificio,
            recursosRestantes: { ...jugador.recursos },
        };
    }

    // ======================================================
    // NOMBRE: getCostos
    // ENTRADA: ninguna
    // SALIDA: objeto con todos los costos de construcción
    // RESTRICCIONES: ninguna
    // OBJETIVO: exponer tabla de costos al frontend si se necesita
    // ======================================================
    getCostos() {
        return { ...COSTOS_CONSTRUCCION };
    }
}

module.exports = GestorConstrucciones;