// ======================================================
// NOMBRE: VerVictoria
// ENTRADA: estado de jugadores y sistemas de la partida
// SALIDA: ganador, ranking final y evento game_over
// OBJETIVO: evaluar condiciones de fin de partida y calcular resultados
// ======================================================

class VerVictoria {
    constructor(sistemas, jugadores, partida, porcentajeVictoria = 0.6) {
        this.sistemas = sistemas;
        this.jugadores = jugadores;
        this.partida = partida;
        this.porcentajeVictoria = porcentajeVictoria;
        this.ganador = null;
        this.partidaFinalizada = false;
    }

    // ======================================================
    // NOMBRE: evaluarVictoria
    // ENTRADA: sin entrada explícita (usa estado interno de jugadores y sistemas)
    // SALIDA: llama a finalizarPartida si se cumple alguna condición de victoria
    // RESTRICCIONES: no evaluar si la partida ya tiene ganador
    // OBJETIVO: verificar las tres condiciones posibles de fin de partida
    // ======================================================
    evaluarVictoria() {
        if (this.ganador || this.partidaFinalizada) return;

        const jugadoresActivos = Array.from(this.jugadores.values()).filter(
            (jugador) => !jugador.eliminado
        );

        const sistemasTotales = this.sistemas.size || 1;

        // 1) un jugador controla el porcentaje configurado de sistemas
        const ganadorPorcentaje = jugadoresActivos.find((jugador) => {
            const control = jugador.sistemas.size / sistemasTotales;
            return control >= this.porcentajeVictoria;
        });

        if (ganadorPorcentaje) {
            this.ganador = ganadorPorcentaje.nickname;
            this._finalizarPartida("porcentaje");
            return;
        }

        // 2) solo queda un jugador activo
        if (jugadoresActivos.length === 1) {
            this.ganador = jugadoresActivos[0].nickname;
            this._finalizarPartida("ultimo_jugador");
            return;
        }

        // 3) tiempo máximo alcanzado (la llama GameLogic externamente)
        // Ver método finalizarPorTiempo()
    }

    // ======================================================
    // NOMBRE: finalizarPorTiempo
    // ENTRADA: sin entrada explícita
    // SALIDA: finaliza la partida usando puntaje como criterio de orden
    // RESTRICCIONES: solo llamar cuando se agota el tiempo máximo de la partida
    // OBJETIVO: determinar ganador por puntaje cuando expira el tiempo
    // ======================================================
    finalizarPorTiempo() {
        if (this.ganador || this.partidaFinalizada) return;

        const jugadoresOrdenados = Array.from(this.jugadores.values())
            .sort((a, b) => this._calcularPuntaje(b) - this._calcularPuntaje(a));

        if (jugadoresOrdenados.length > 0) {
            this.ganador = jugadoresOrdenados[0].nickname;
        }

        this._finalizarPartida("tiempo");
    }

    // ======================================================
    // NOMBRE: _finalizarPartida
    // ENTRADA: motivo de finalización (porcentaje | ultimo_jugador | tiempo)
    // SALIDA: evento game_over emitido con ranking completo
    // RESTRICCIONES: solo finalizar una vez por partida
    // OBJETIVO: cerrar la partida, calcular ranking y notificar a todos los jugadores
    // ======================================================
    _finalizarPartida(motivo) {
        this.partidaFinalizada = true;

        const ranking = Array.from(this.jugadores.values())
            .map((jugador) => ({
                socketId: jugador.socketId,
                nickname: jugador.nickname,
                puntaje: this._calcularPuntaje(jugador),
                sistemasConquistados: jugador.sistemas.size,
                recursos: { ...jugador.recursos },
                flotasEnPie: this._calcularFlotasJugador(jugador.socketId),
                minasEnPie: this._contarEstructuras(jugador.socketId, "minas"),
                centrosEnPie: this._contarEstructuras(jugador.socketId, "centrales"),
                fortalezasEnPie: this._contarEstructuras(jugador.socketId, "fortalezas"),
            }))
            .sort((a, b) => b.puntaje - a.puntaje)
            .map((jugador, index) => ({ ...jugador, posicion: index + 1 }));

        const motivoTexto = {
            porcentaje: `${this.ganador} controló el ${Math.round(this.porcentajeVictoria * 100)}% de la galaxia`,
            ultimo_jugador: `${this.ganador} es el último jugador en pie`,
            tiempo: `Tiempo agotado. ${this.ganador} lidera por puntaje`,
        };

        if (global.io && this.partida?.id) {
            global.io.to(this.partida.id).emit("game_over", {
                motivo,
                motivoTexto: motivoTexto[motivo] || motivo,
                ganador: this.ganador,
                ranking,
                eventos: this.onObtenerEventos ? this.onObtenerEventos() : [],
            });
        }

        if (this.onPartidaFinalizada) {
            this.onPartidaFinalizada();
        }
    }

    // ======================================================
    // NOMBRE: _calcularPuntaje
    // ENTRADA: objeto jugador
    // SALIDA: puntaje total según fórmula del enunciado
    // RESTRICCIONES: ninguna
    // OBJETIVO: calcular puntaje para ranking (sistemas x5000 + recursos + infraestructura)
    // ======================================================
    _calcularPuntaje(jugador) {
        const puntajeSistemas = jugador.sistemas.size * 5000;

        const puntajeRecursos =
            (jugador.recursos.minerales * 1) +
            (jugador.recursos.energia   * 2) +
            (jugador.recursos.cristales * 3);

        const puntajeEstructuras = Array.from(this.sistemas.values())
            .filter((sistema) => sistema.propietarioId === jugador.socketId)
            .reduce((total, sistema) => {
                return total
                    + (sistema.fortalezas || 0) * 100
                    + (sistema.centrales  || 0) * 150;
            }, 0);

        return puntajeSistemas + puntajeRecursos + puntajeEstructuras;
    }

    // ======================================================
    // NOMBRE: _calcularFlotasJugador
    // ENTRADA: socketId del jugador
    // SALIDA: total de flotas activas en todos sus sistemas
    // RESTRICCIONES: ninguna
    // OBJETIVO: sumar flotas para las estadísticas finales
    // ======================================================
    _calcularFlotasJugador(socketId) {
        return Array.from(this.sistemas.values())
            .filter((sistema) => sistema.propietarioId === socketId)
            .reduce((total, sistema) => total + (sistema.flotas || 0), 0);
    }

    // ======================================================
    // NOMBRE: _contarEstructuras
    // ENTRADA: socketId del jugador, campo de estructura (minas, centrales, etc.)
    // SALIDA: total de esa estructura en todos los sistemas del jugador
    // RESTRICCIONES: campo debe existir en el objeto sistema
    // OBJETIVO: calcular infraestructura activa para estadísticas finales
    // ======================================================
    _contarEstructuras(socketId, campo) {
        return Array.from(this.sistemas.values())
            .filter((sistema) => sistema.propietarioId === socketId)
            .reduce((total, sistema) => total + (sistema[campo] || 0), 0);
    }
}

module.exports = VerVictoria;