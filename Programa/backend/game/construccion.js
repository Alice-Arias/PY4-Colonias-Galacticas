class Construccion {

    // ======================================================
    // NOMBRE: constructor
    // OBJETIVO: Inicializar costos de construcción
    // ======================================================
    constructor() {
        // ======================================================
        // NOMBRE: costos
        // ENTRADA: tipo de contruccion:(mina, central, astillero, fortaleza)
        // SALIDA: objeto con lo que cuesta crearlo
        // RESTRICCIONES:
        // - solo modificar si se quiere cambiar el balance del juego, o que no lo puse como lo pidio el profe
        // - mantener las propiedades de recursos
        // OBJETIVO:
        // tener los costos mas a mano para consultas y manejo mas claro
        // ======================================================
        this.costos = {
            mina:      { minerales: 100, energia: 0,   cristales: 0   },
            central:   { minerales: 80,  energia: 50,  cristales: 200 },
            astillero: { minerales: 150, energia: 100, cristales: 10  },
            fortaleza: { minerales: 200, energia: 100, cristales: 30  },
        };
    }

    // ======================================================
    // NOMBRE: construir
    // ENTRADA: partida, socketId, sistemaId, tipo
    // SALIDA: { true, error } — true si se construyó, error si no
    // RESTRICCIONES:
    // - El jugador tiene que ser propietario del sistema
    // - Tener recursos suficientes
    // - tipo(mina, central, astillero, fortaleza)
    // OBJETIVO:
    // Construir en los sistemas dominados por los jugadores
    // ======================================================
    construir(partida, socketId, sistemaId, tipo) {
        const jugador = partida.jugadores.find((j) => j.id === socketId);
        if (!jugador) return { exito: false, error: "Jugador no encontrado" };

        const sistema = partida.galaxia.sistemas.find((s) => s.id === sistemaId);
        if (!sistema) return { exito: false, error: "Sistema no encontrado" };

        if (sistema.propietario !== jugador.nickname)
            return { exito: false, error: "No eres propietario de este sistema" };

        const costo = this.costos[tipo];
        if (!costo) return { exito: false, error: "Tipo de instalación inválido" };

        if (
            jugador.recursos.minerales < costo.minerales ||
            jugador.recursos.energia   < costo.energia   ||
            jugador.recursos.cristales < costo.cristales
        ) return { exito: false, error: "Recursos insuficientes" };

        jugador.recursos.minerales -= costo.minerales;
        jugador.recursos.energia   -= costo.energia;
        jugador.recursos.cristales -= costo.cristales;

        if (!sistema.instalaciones) sistema.instalaciones = [];
        sistema.instalaciones.push(tipo);

        return true;
    }
}

module.exports = Construccion;