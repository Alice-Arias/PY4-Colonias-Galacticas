class Jugador {
    constructor(nombre) {
        this.nombre = nombre;
        this.minerales = 0;
        this.energia = 0;
        this.cristales = 0;
        this.sistemasControlados = [];
    }
}

module.exports = Jugador;