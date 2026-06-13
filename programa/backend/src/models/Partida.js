class Partida {
    constructor(nombre, galaxia, maxJugadores, maxDuracion, recursosIniciales) {
        this.nombre = nombre;
        this.galaxia = galaxia;
        this.maxJugadores = maxJugadores;
        this.maxDuracion = maxDuracion;
        this.recursosIniciales = recursosIniciales;
        this.jugadores = [];
    }
    agregarJugador(jugador) {
        if (this.jugadores.length >= this.maxJugadores) {
            throw new Error("La sala está llena :(")
        }

        jugador.minerales = this.recursosIniciales.minerales;
        jugador.energia = this.recursosIniciales.energia;
        jugador.cristales = this.recursosIniciales.cristales;

        this.jugadores.push(jugador);
    }
    estaLlena() {
        return this.jugadores.length >= this.maxJugadores
    }
}

module.exports = Partida;