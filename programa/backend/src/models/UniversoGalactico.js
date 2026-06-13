class UniversoGalactico {
    constructor() {
        this.sistemas = new Map();
        this.adyacencias = new Map();
    }

    agregarSistema(sistema) {
        this.sistemas.set(sistema.nombre, sistema);
        this.adyacencias.set(sistema.nombre, []);
    }

    agregarRuta(origen, destino) {
        this.adyacencias.get(origen).push(destino);
        this.adyacencias.get(destino).push(origen);
    }
}

module.exports = UniversoGalactico;
