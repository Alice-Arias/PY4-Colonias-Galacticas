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
    enviarFlotas(socketId, origenId, destinoId, cantidad, inicioHabilitado, gestorCombate, permitirAtaque = false) {
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

        if (!this._hayRutaValida(origenId, destinoId)) {
            return { exito: false, mensaje: "No existe una ruta válida hacia ese sistema" };
        }

        // Fallback de robustez: si llega por "enviar_flotas" hacia enemigo,
        // lo tratamos como conquista automática para no depender del botón correcto en frontend.
        if (destino.propietarioId && destino.propietarioId !== socketId && !permitirAtaque) {
            permitirAtaque = true;
        }

        const flotasDisponibles = origen.flotas || 0;
        if (cantidadFlotas <= 0 || cantidadFlotas > flotasDisponibles) {
            return {
                exito: false,
                mensaje: `Flotas insuficientes. Disponibles: ${flotasDisponibles}, solicitadas: ${cantidadFlotas}`,
            };
        }

        const costoEnvio = this.getCostoEnvio(cantidadFlotas);

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

        // 1.1) destino sin dueño: conquista inmediata
        if (!destino.propietarioId) {
            return this._conquistarSistemaNeutral({
                socketId,
                destinoId,
                cantidadFlotas,
                costoEnvio,
            });
        }

        // 2) destino enemigo con conquista automática
        if (destino.propietarioId && destino.propietarioId !== socketId && permitirAtaque) {
            if (!gestorCombate) {
                return { exito: false, mensaje: "No se pudo iniciar la conquista" };
            }

            return gestorCombate.resolverAtaque(socketId, origen, destino, cantidadFlotas, costoEnvio);
        }

        return {
            exito: true,
            mensaje: `${cantidadFlotas} flotas trasladadas de ${origen.nombre} a ${destino.nombre}`,
            costo: costoEnvio,
            conquistado: false,
        };
    }

    // ======================================================
    // NOMBRE: _hayRutaValida
    // ENTRADA: id origen, id destino, socketId del jugador que mueve
    // SALIDA: booleano indicando si existe ruta transitable
    // RESTRICCIONES: solo se permite movimiento por ruta directa entre origen y destino
    // OBJETIVO: validar adyacencia real en el grafo
    // ======================================================
    _hayRutaValida(origenId, destinoId) {
        if (origenId === destinoId) return false;

        const vecinosOrigen = this.rutas.get(origenId);
        if (!vecinosOrigen) return false;

        return vecinosOrigen.has(destinoId);
    }

    // ======================================================
    // NOMBRE: _conquistarSistemaNeutral
    // ENTRADA: socketId del jugador, id del destino, cantidad de flotas y costo
    // SALIDA: resultado de conquista neutral listo para emitir a la UI
    // RESTRICCIONES: destino sin propietario y jugador existente
    // OBJETIVO: encapsular transferencia de ownership neutral en un solo método
    // ======================================================
    _conquistarSistemaNeutral({ socketId, destinoId, cantidadFlotas, costoEnvio }) {
        const jugador = this.jugadores.get(socketId);
        const destino = this.sistemas.get(destinoId);

        if (!jugador || !destino) {
            return { exito: false, mensaje: "No se pudo completar la conquista" };
        }

        destino.propietarioId = socketId;
        destino.propietario = jugador.nickname;
        destino.flotas = cantidadFlotas;
        destino.bajoAtaque = false;

        jugador.sistemas.add(destinoId);
        jugador.sistemasControlados = jugador.sistemas.size;

        return {
            exito: true,
            mensaje: `${jugador.nickname} conquistó ${destino.nombre}`,
            costo: costoEnvio,
            conquistado: true,
            nuevoPropietario: jugador.nickname,
        };
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