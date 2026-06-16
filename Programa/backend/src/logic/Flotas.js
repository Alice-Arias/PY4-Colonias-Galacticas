// ======================================================
// NOMBRE: Flotas
// ENTRADA: datos del jugador, sistema origen, destino y cantidad de flotas
// SALIDA: resultado del movimiento, conquista o inicio de combate
// OBJETIVO: validar y ejecutar el movimiento de flotas entre sistemas
// ======================================================

const COSTO_ENVIO_POR_FLOTA = {
    minerales: 3,
    energia: 5,
    cristales: 1,
};

class GestorFlotas {
    constructor(sistemas, rutas, jugadores) {
        this.sistemas = sistemas;
        this.rutas = rutas;
        this.jugadores = jugadores;
    }

    // ======================================================
    // NOMBRE: enviarFlotas
    // ENTRADA: socketId, origenId, destinoId, cantidad, inicioHabilitado, gestorCombate
    // SALIDA: resultado del movimiento: traslado, conquista neutra o inicio de combate
    // RESTRICCIONES: ruta válida, flotas disponibles, recursos suficientes para el envío
    // OBJETIVO: mover flotas respetando el grafo y las reglas de conquista
    // ======================================================
    enviarFlotas(socketId, origenId, destinoId, cantidad, inicioHabilitado, gestorCombate) {
        const jugador = this.jugadores.get(socketId);
        const origen = this.sistemas.get(origenId);
        const destino = this.sistemas.get(destinoId);
        const cantidadFlotas = Math.floor(Number(cantidad) || 0);

        if (!jugador) {
            return { exito: false, mensaje: "Jugador no encontrado" };
        }

        if (!inicioHabilitado) {
            return { exito: false, mensaje: "Presiona U para iniciar la partida" };
        }

        if (!origen || !destino) {
            return { exito: false, mensaje: "Origen o destino inválido" };
        }

        if (origen.propietarioId !== socketId) {
            return { exito: false, mensaje: "Solo puedes enviar flotas desde tus sistemas" };
        }

        if (origen.bajoAtaque) {
            return { exito: false, mensaje: "El sistema origen está siendo atacado" };
        }

        if (destino.bajoAtaque) {
            return { exito: false, mensaje: "El sistema destino está siendo atacado" };
        }

        if (!this._hayRutaValida(origenId, destinoId, socketId)) {
            return { exito: false, mensaje: "No existe una ruta válida hacia ese sistema" };
        }

        const flotasDisponibles = origen.flotas || 0;
        if (cantidadFlotas <= 0 || cantidadFlotas > flotasDisponibles) {
            return {
                exito: false,
                mensaje: `Flotas insuficientes. Disponibles: ${flotasDisponibles}, solicitadas: ${cantidadFlotas}`,
            };
        }

        const costoEnvio = {
            minerales: COSTO_ENVIO_POR_FLOTA.minerales * cantidadFlotas,
            energia:   COSTO_ENVIO_POR_FLOTA.energia   * cantidadFlotas,
            cristales: COSTO_ENVIO_POR_FLOTA.cristales * cantidadFlotas,
        };

        const puedePagarEnvio =
            jugador.recursos.minerales >= costoEnvio.minerales &&
            jugador.recursos.energia   >= costoEnvio.energia   &&
            jugador.recursos.cristales >= costoEnvio.cristales;

        if (!puedePagarEnvio) {
            return {
                exito: false,
                mensaje: `Recursos insuficientes para mover ${cantidadFlotas} flotas. Costo: ${costoEnvio.minerales}M / ${costoEnvio.energia}E / ${costoEnvio.cristales}C`,
            };
        }

        // Desconta costo de envío y flotas del origen
        jugador.recursos.minerales -= costoEnvio.minerales;
        jugador.recursos.energia   -= costoEnvio.energia;
        jugador.recursos.cristales -= costoEnvio.cristales;
        origen.flotas -= cantidadFlotas;

        // 1) destino propio
        if (destino.propietarioId === socketId) {
            destino.flotas = (destino.flotas || 0) + cantidadFlotas;
            return {
                exito: true,
                mensaje: `${cantidadFlotas} flotas trasladadas de ${origen.nombre} a ${destino.nombre}`,
                costo: costoEnvio,
            };
        }

        // 2) destino enemigo
        if (destino.propietarioId && destino.propietarioId !== socketId) {
            return gestorCombate.resolverAtaque(socketId, origen, destino, cantidadFlotas, costoEnvio);
        }

        // 3) destino neutro — conquistar
        destino.bajoAtaque = true;
        const conquista = gestorCombate.conquistarSistema(socketId, destino.id, {
            flotasRestantes: cantidadFlotas,
        });
        destino.bajoAtaque = false;

        return {
            exito: true,
            mensaje: conquista.conquistado
                ? `Sistema neutral ${destino.nombre} conquistado`
                : `No se pudo conquistar ${destino.nombre}`,
            batalla: conquista,
            costo: costoEnvio,
        };
    }

    // ======================================================
    // NOMBRE: _hayRutaValida
    // ENTRADA: id origen, id destino, socketId del jugador que mueve
    // SALIDA: booleano indicando si existe ruta transitable
    // RESTRICCIONES: no atravesar sistemas enemigos (solo el destino puede serlo)
    // OBJETIVO: validar navegación según las conexiones del grafo
    // ======================================================
    _hayRutaValida(origenId, destinoId, socketId) {
        if (origenId === destinoId) return false;

        const visitados = new Set([origenId]);
        const cola = [origenId];

        while (cola.length > 0) {
            const actual = cola.shift();
            const vecinos = Array.from(this.rutas.get(actual) || []);

            for (const vecino of vecinos) {
                if (visitados.has(vecino)) continue;

                if (vecino !== destinoId) {
                    const sistemaVecino = this.sistemas.get(vecino);
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
    // NOMBRE: getCostoEnvio
    // ENTRADA: cantidad de flotas a mover
    // SALIDA: objeto con costo total en minerales, energía y cristales
    // RESTRICCIONES: cantidad debe ser mayor a 0
    // OBJETIVO: calcular y exponer el costo de mover flotas
    // ======================================================
    getCostoEnvio(cantidad) {
        return {
            minerales: COSTO_ENVIO_POR_FLOTA.minerales * cantidad,
            energia:   COSTO_ENVIO_POR_FLOTA.energia   * cantidad,
            cristales: COSTO_ENVIO_POR_FLOTA.cristales * cantidad,
        };
    }
}

module.exports = GestorFlotas;