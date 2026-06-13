const fs = require("fs");

const SistemaPlanetario = require("../models/SistemaPlanetario");

const UniversoGalactico = require("../models/UniversoGalactico");

class CargadorGalaxia {
    static cargar() {
        const raw = fs.readFileSync("./src/data/galaxia1.json", "utf8");

        const data = JSON.parse(raw);

        const universo = new UniversoGalactico();

        data.sistemas.forEach((sistema) => {
            universo.agregarSistema(
                new SistemaPlanetario(
                    sistema.nombre,
                    sistema.descripcion,
                    sistema.tipo,
                    sistema.minerales,
                    sistema.energia,
                    sistema.cristales,
                ),
            );
        });

        data.rutas.forEach((ruta) => {
            universo.agregarRuta(ruta.origen, ruta.destino);
        });

        return universo;
    }
}

module.exports = CargadorGalaxia;
