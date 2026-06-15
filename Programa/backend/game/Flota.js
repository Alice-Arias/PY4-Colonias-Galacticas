class Flota {

    // ======================================================
    // NOMBRE: rutaExiste
    // ENTRADA: rutas de la galaxia, origenId, destinoId
    // SALIDA: true si existe ruta directa, false si no
    // RESTRICCIONES:
    // - Las rutas son bidireccionales
    // OBJETIVO:
    // Ver si existe una conexion que vaya directa entre 2 sistemas
    // ======================================================
    rutaExiste(rutas, origenId, destinoId) {
        return rutas.some(
            ([a, b]) => (a === origenId && b === destinoId) || (a === destinoId && b === origenId)
        );
    }

    // ======================================================
    // NOMBRE: moverFlota
    // ENTRADA: partida, socketId, origenId, destinoId, cantidad
    // SALIDA: { true, error } — true si se movió, error si falló
    // RESTRICCIONES:
    // - El jugador debe ser propietario del sistema origen
    // - Debe existir ruta directa entre origen y destino
    // - El destino no debe estar controlado por un tercero
    // - El origen debe tener suficientes astilleros
    // OBJETIVO:
    // Mover flotas entre sistemas conectados del jugador
    // ======================================================
    moverFlota(partida, socketId, origenId, destinoId, cantidad) {
        const jugador = partida.jugadores.find((j) => j.id === socketId);
        if (!jugador) return { exito: false, error: "Jugador no encontrado" };

        const origen = partida.galaxia.sistemas.find((s) => s.id === origenId);
        if (!origen) return { exito: false, error: "Sistema origen no encontrado" };

        const destino = partida.galaxia.sistemas.find((s) => s.id === destinoId);
        if (!destino) return { exito: false, error: "Sistema destino no encontrado" };

        if (origen.propietario !== jugador.nickname)
            return { exito: false, error: "No eres propietario del sistema origen" };

        if (!this.rutaExiste(partida.galaxia.rutas, origenId, destinoId))
            return { exito: false, error: "No existe ruta directa entre estos sistemas" };

        if (destino.propietario && destino.propietario !== jugador.nickname)
            return { exito: false, error: "El sistema destino está controlado por otro jugador" };

        if (!origen.instalaciones) origen.instalaciones = [];
        const astillerosOrigen = origen.instalaciones.filter((i) => i === "astillero").length;

        if (astillerosOrigen < cantidad)
            return { exito: false, error: "No tienes suficientes astilleros en el sistema origen" };

        let removidos = 0;
        origen.instalaciones = origen.instalaciones.filter((i) => {
            if (i === "astillero" && removidos < cantidad) {
                removidos++;
                return false;
            }
            return true;
        });

        if (!destino.instalaciones) destino.instalaciones = [];
        for (let i = 0; i < cantidad; i++) {
            destino.instalaciones.push("astillero");
        }

        if (!destino.propietario) {
            destino.propietario = jugador.nickname;
            destino.estado = "controlado";
        }

        return true;
    }
}

module.exports = Flota;