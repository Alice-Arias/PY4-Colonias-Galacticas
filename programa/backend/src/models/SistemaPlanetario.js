class SistemaPlanetario {
    constructor(nombre, descripcion, tipo, minerales, energia, cristales) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.tipo = tipo;

        this.produccion = {
            minerales,
            energia,
            cristales,
        };

        this.propietario = null;

        this.flotas = [];

        this.instalaciones = [];

        this.estadoExploracion = "NO_EXPLORADO";
    }
}

module.exports = SistemaPlanetario;
