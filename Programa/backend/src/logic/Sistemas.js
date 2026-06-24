// ======================================================
// NOMBRE: Sistemas
// ENTRADA: datos de la galaxia desde la partida
// SALIDA: sistemas y rutas cargados en mapas internos
// OBJETIVO: centralizar el acceso y manejo del mapa galáctico
// ======================================================
const PRODUCCION_POR_TIPO = {
    minero:     { minerales: 100, energia: 30,  cristales: 10 },
    energetico: { minerales: 50,  energia: 50,  cristales: 10 },
    cientifico: { minerales: 40,  energia: 40,  cristales: 30 },
    balanceado: { minerales: 35,  energia: 35,  cristales: 35 },
};

class GestorSistemas {
    constructor(sistemas, rutas) {
        this.sistemas = sistemas;
        this.rutas = rutas;
    }

    // ======================================================
    // NOMBRE: cargarSistemas
    // ENTRADA: objeto galaxia con arreglo de sistemas
    // SALIDA: mapa de sistemas inicializado
    // RESTRICCIONES: galaxia válida con sistemas definidos
    // OBJETIVO: poblar el mapa de sistemas con estado inicial limpio
    // ======================================================
    cargarSistemas(galaxia) {
        this.sistemas.clear();
        const sistemasOriginales = galaxia?.sistemas || [];

        sistemasOriginales.forEach((sistema) => {
            this.sistemas.set(sistema.id, {
                id: sistema.id,
                nombre: sistema.nombre,
                tipo: sistema.tipo,
                x: sistema.x,
                y: sistema.y,
                propietario: null,
                propietarioId: null,
                recursos: {
                    minerales: 0,
                    energia: 0,
                    cristales: 0,
                },
                produccion: { ...(sistema.produccion || this.produccionPorTipo(sistema.tipo)) },
                flotas: 0,
                minas: 0,
                centrales: 0,
                astilleros: 0,
                fortalezas: 0,
                bajoAtaque: false,
            });
        });
    }

    // ======================================================
    // NOMBRE: cargarRutas
    // ENTRADA: objeto galaxia con arreglo de rutas
    // SALIDA: mapa bidireccional
    // RESTRICCIONES: rutas definidas como [origen, destino]
    // OBJETIVO: construir el grafo de navegación entre sistemas
    // ======================================================
    cargarRutas(galaxia) {
        this.rutas.clear();
        const rutasOriginales = galaxia?.rutas || [];

        rutasOriginales.forEach(([origen, destino]) => {
            if (!this.rutas.has(origen)) this.rutas.set(origen, new Set());
            if (!this.rutas.has(destino)) this.rutas.set(destino, new Set());
            this.rutas.get(origen).add(destino);
            this.rutas.get(destino).add(origen);
        });
    }

    // ======================================================
    // NOMBRE: getSistema
    // ENTRADA: id del sistema
    // SALIDA: objeto sistema o null si no existe
    // RESTRICCIONES: id tiene que corresponder a un sistema cargado
    // OBJETIVO: acceso centralizado y seguro a un sistema por id
    // ======================================================
    getSistema(sistemaId) {
        return this.sistemas.get(sistemaId) || null;
    }

    // ======================================================
    // NOMBRE: getVecinos
    // ENTRADA: id del sistema
    // SALIDA: Set de ids de sistemas vecinos
    // RESTRICCIONES: sistema debe existir en el mapa de rutas
    // OBJETIVO: exponer las conexiones directas de un sistema
    // ======================================================
    getVecinos(sistemaId) {
        return this.rutas.get(sistemaId) || new Set();
    }

    // ======================================================
    // NOMBRE: hayRutaValida
    // ENTRADA: id origen, id destino, socketId del jugador que mueve
    // SALIDA: booleano indicando si existe ruta transitable
    // RESTRICCIONES: no atravesar sistemas enemigos (solo el destino puede serlo)
    // OBJETIVO: validar navegación según reglas del grafo
    // ======================================================
    hayRutaValida(origenId, destinoId, socketId) {
        if (origenId === destinoId) return false;

        const visitados = new Set([origenId]);
        const cola = [origenId];

        while (cola.length > 0) {
            const actual = cola.shift();
            const vecinos = Array.from(this.rutas.get(actual) || []);

            for (const vecino of vecinos) {
                if (visitados.has(vecino)) continue;

                if (vecino !== destinoId) {
                    const sistemaVecino = this.getSistema(vecino);
                    if (sistemaVecino?.propietarioId && sistemaVecino.propietarioId !== socketId) {
                        continue;
                    }
                }

                if (vecino === destinoId) return true;
                visitados.add(vecino);
                cola.push(vecino);
            }
        }

        return false;
    }

    // ======================================================
    // NOMBRE: produccionPorTipo
    // ENTRADA: tipo de planeta (minero, energetico, cientifico, balanceado)
    // SALIDA: objeto con produccion base de minerales, energia y cristales
    // RESTRICCIONES: tipo debe ser uno de los definidos; si no, usa balanceado
    // OBJETIVO: centralizar la tabla de producción por tipo de planeta
    // ======================================================
    produccionPorTipo(tipo) {
        return PRODUCCION_POR_TIPO[tipo] || PRODUCCION_POR_TIPO.balanceado;
    }

    // ======================================================
    // NOMBRE: getSistemasDeJugador
    // ENTRADA: socketId del jugador
    // SALIDA: arreglo de sistemas controlados por ese jugador
    // RESTRICCIONES: ninguna
    // OBJETIVO: obtener todos los sistemas de un jugador de forma eficiente
    // ======================================================
    getSistemasDeJugador(socketId) {
        return Array.from(this.sistemas.values()).filter(
            (sistema) => sistema.propietarioId === socketId
        );
    }

    // ======================================================
    // NOMBRE: getTotalSistemas
    // ENTRADA: ninguna
    // SALIDA: cantidad total de sistemas en el mapa
    // RESTRICCIONES: ninguna
    // OBJETIVO: referencia para calcular porcentaje de control
    // ======================================================
    getTotalSistemas() {
        return this.sistemas.size;
    }
}

module.exports = GestorSistemas;