// ======================================================
// NOMBRE: GestorProduccion
// ENTRADA: configuración de intervalo y referencias a sistemas y jugadores
// SALIDA: recursos aplicados a jugadores cada ciclo de producción
// OBJETIVO: ejecutar ciclos periódicos de producción de recursos
// ======================================================

const PRODUCCION_CENTRAL = {
    minerales: 50,
    energia: 25,
    cristales: 10,
};

class GestorProduccion {
    constructor(sistemas, jugadores, partida, intervaloMs = 20000) {
        this.sistemas = sistemas;
        this.jugadores = jugadores;
        this.partida = partida;
        this.intervaloMs = intervaloMs;
        this.tiempoRestante = Math.floor(intervaloMs / 1000);
        this.intervaloTimer = null;
        this.inicioHabilitado = false;
    }

    // ======================================================
    // NOMBRE: iniciarProduccion
    // ENTRADA: sin entrada explícita (usa configuración interna)
    // SALIDA: temporizador activo que emite production_timer cada segundo
    // RESTRICCIONES: solo un temporizador activo por partida
    // OBJETIVO: ejecutar ciclos periódicos de producción de recursos
    // ======================================================
    iniciarProduccion() {
        this.detener();

        this.intervaloTimer = setInterval(() => {
            // Si el juego no ha iniciado con U, solo emite el timer sin producir
            if (!this.inicioHabilitado) {
                this._emitirTimer();
                return;
            }

            this.tiempoRestante -= 1;

            // Bug: el ciclo se activa cuando llega a 0, no cuando es negativo
            if (this.tiempoRestante <= 0) {
                this._aplicarProduccion();
                this.tiempoRestante = Math.floor(this.intervaloMs / 1000);
            }

            this._emitirTimer();
        }, 1000);

        this._emitirTimer();
    }

    // ======================================================
    // NOMBRE: _aplicarProduccion
    // ENTRADA: sin entrada (usa mapas internos de sistemas y jugadores)
    // SALIDA: recursos sumados a cada jugador según sus sistemas controlados
    // RESTRICCIONES: solo aplica a jugadores activos con sistemas controlados
    // OBJETIVO: distribuir producción del ciclo a cada jugador
    // ======================================================
    _aplicarProduccion() {
        this.jugadores.forEach((jugador, socketId) => {
            if (jugador.eliminado) return;

            const sistemasControlados = Array.from(this.sistemas.values()).filter(
                (sistema) => sistema.propietarioId === socketId
            );

            sistemasControlados.forEach((sistema) => {
                const centrales = sistema.centrales || 0;
                const astilleros = sistema.astilleros || 0;
                const produccionBase = sistema.produccion || { minerales: 0, energia: 0, cristales: 0 };
                const produccionCentrales = {
                    minerales: centrales * PRODUCCION_CENTRAL.minerales,
                    energia: centrales * PRODUCCION_CENTRAL.energia,
                    cristales: centrales * PRODUCCION_CENTRAL.cristales,
                };

                const produccionTotal = {
                    minerales: (produccionBase.minerales || 0) + produccionCentrales.minerales,
                    energia: (produccionBase.energia || 0) + produccionCentrales.energia,
                    cristales: (produccionBase.cristales || 0) + produccionCentrales.cristales,
                };

                jugador.recursos.minerales += produccionTotal.minerales;
                jugador.recursos.energia += produccionTotal.energia;
                jugador.recursos.cristales += produccionTotal.cristales;

                sistema.recursos = sistema.recursos || { minerales: 0, energia: 0, cristales: 0 };
                sistema.recursos.minerales += produccionTotal.minerales;
                sistema.recursos.energia += produccionTotal.energia;
                sistema.recursos.cristales += produccionTotal.cristales;

                sistema.flotas = (sistema.flotas || 0) + astilleros;
            });
        });

        this._registrarEvento("production", {
            jugador: "Sistema",
            mensaje: "Producción generada en todos los sistemas controlados",
            color: "#00ff88",
        });

        if (this.onProduccionAplicada) {
            this.onProduccionAplicada();
        }
    }

    // ======================================================
    // NOMBRE: _emitirTimer
    // ENTRADA: sin entrada explícita
    // SALIDA: evento production_timer emitido a todos los clientes
    // RESTRICCIONES: requiere global.io y partida válida
    // OBJETIVO: mantener sincronizado el temporizador de producción en el frontend
    // ======================================================
    _emitirTimer() {
        if (!global.io || !this.partida?.id) return;

        global.io.to(this.partida.id).emit("production_timer", {
            segundosRestantes: this.tiempoRestante,
            intervalo: this.intervaloMs,
        });
    }

    // ======================================================
    // NOMBRE: detener
    // ENTRADA: sin entrada
    // SALIDA: temporizador limpiado
    // RESTRICCIONES: ninguna
    // OBJETIVO: detener el ciclo de producción al finalizar la partida
    // ======================================================
    detener() {
        if (this.intervaloTimer) {
            clearInterval(this.intervaloTimer);
            this.intervaloTimer = null;
        }
    }

    // ======================================================
    // NOMBRE: _registrarEvento
    // ENTRADA: tipo de evento y payload con detalles
    // SALIDA: ninguna (delega al manejador externo)
    // RESTRICCIONES: onRegistrarEvento debe estar asignado por GameLogic
    // OBJETIVO: registrar eventos de producción en el log global
    // ======================================================
    _registrarEvento(tipo, payload) {
        if (this.onRegistrarEvento) {
            this.onRegistrarEvento(tipo, payload);
        }
    }
}

module.exports = GestorProduccion;