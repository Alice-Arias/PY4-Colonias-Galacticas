// ======================================================
// NOMBRE: Combates
// ENTRADA: datos del atacante, defensor, sistema destino y flotas
// SALIDA: resultado del combate y nuevo estado del sistema
// OBJETIVO: resolver enfrentamientos y conquistas entre jugadores
// ======================================================

// Regla enunciado: cada unidad atacante neutraliza 3 minas.
const MINAS_NEUTRALIZADAS_POR_UNIDAD_ATAQUE = 3;
// Regla enunciado: para derribar una fortaleza se requieren 2 unidades de ataque.
const UNIDADES_ATAQUE_POR_FORTALEZA = 2;

class GestorCombates {
    constructor(sistemas, jugadores, partida) {
        this.sistemas = sistemas;
        this.jugadores = jugadores;
        this.partida = partida;
        this.batallasActivas = new Set();
    }

    // ======================================================
    // NOMBRE: resolverAtaque
    // ENTRADA: socketId atacante, sistema origen, sistema destino, cantidad de flotas, costo pagado
    // SALIDA: objeto con resultado inmediato; el resultado final llega por evento battle_result
    // RESTRICCIONES: no iniciar dos batallas simultáneas en el mismo sistema
    // OBJETIVO: gestionar el flujo completo de un ataque entre jugadores
    // ======================================================
    resolverAtaque(socketId, origen, destino, cantidad, costoEnvio) {
        const atacante = this.jugadores.get(socketId);
        const defensor = this.jugadores.get(destino.propietarioId);

        if (!atacante || !defensor) {
            return { exito: false, mensaje: "No se pudo resolver el combate: jugador no encontrado" };
        }

        if (this.batallasActivas.has(destino.id)) {
            return { exito: false, mensaje: "El sistema ya está siendo atacado" };
        }

        this.batallasActivas.add(destino.id);
        destino.bajoAtaque = true;

        // Notificar inicio de batalla a todos los jugadores
        if (global.io && this.partida?.id) {
            const minas = Number(destino.minas || 0);
            const fortalezas = Number(destino.fortalezas || 0);
            const flotasDefensoras = Number(destino.flotas || 0);
            const astillerosApoyo = Number(origen?.astilleros || 0);
            const unidadesMinas = Math.ceil(minas / MINAS_NEUTRALIZADAS_POR_UNIDAD_ATAQUE);
            const astillerosNecesariosMin = (fortalezas * UNIDADES_ATAQUE_POR_FORTALEZA) + Math.max(0, unidadesMinas - Number(cantidad || 0));
            
            const datoBatalla = {
                sistemaId: destino.id,
                sistemaNombre: destino.nombre,
                atacanteId: atacante.socketId,
                atacante: atacante.nickname,
                defensorId: defensor.socketId,
                defensor: defensor.nickname,
                flotasAtacantes: cantidad,
                astillerosApoyo,
                defensa: {
                    flotas: flotasDefensoras,
                    minas,
                    fortalezas,
                    astillerosMinimosParaConquistar: astillerosNecesariosMin,
                },
            };
            
            // Emitir battle_start a todos en la partida
            global.io.to(this.partida.id).emit("battle_start", datoBatalla);
            this._registrarEvento("battle_start", {
                jugador: atacante.nickname,
                mensaje: `atacó ${destino.nombre} con ${cantidad} flotas`,
                color: "#ffa94d",
            });
            
            // Notificación especial al defensor
            if (defensor.socketId) {
                global.io.to(defensor.socketId).emit("incoming_attack", {
                    atacante: atacante.nickname,
                    sistema: destino.nombre,
                    flotasAtacantes: cantidad,
                    defensa: datoBatalla.defensa,
                });
            }
            
            console.log(`[BATALLA] Inicio: ${atacante.nickname} (${cantidad} flotas, ${astillerosApoyo} astilleros apoyo) ataca ${destino.nombre}`);
        }

        setTimeout(() => {
            let resultado = null;

            try {
                resultado = this._calcularResultado(socketId, origen, destino, atacante, defensor, cantidad);
            } catch (error) {
                resultado = {
                    sistemaId: destino.id,
                    sistemaNombre: destino.nombre,
                    atacante: atacante.nickname,
                    defensor: defensor.nickname,
                    ganador: defensor.nickname,
                    derrotado: atacante.nickname,
                    ataqueGana: false,
                    planetaConquistado: false,
                    conquistador: null,
                    flotasRestantes: 0,
                    error: "Error al resolver batalla",
                };
            } finally {
                if (global.io && this.partida?.id) {
                    global.io.to(this.partida.id).emit("battle_result", resultado);
                    // Envío de confirmación adicional para garantizar recepción
                    global.io.to(this.partida.id).emit("combat_completed", {
                        timestamp: new Date().toISOString(),
                        resultado: resultado,
                    });

                    // Notificación dedicada al jugador que perdió el sistema conquistado.
                    if (resultado?.planetaConquistado && defensor?.socketId) {
                        global.io.to(defensor.socketId).emit("sistema_conquistado", {
                            sistemaId: resultado.sistemaId,
                            sistemaNombre: resultado.sistemaNombre,
                            atacante: resultado.atacante,
                            defensor: resultado.defensor,
                            flotasRestantes: resultado.flotasRestantes || 0,
                        });
                    }
                }

                this.batallasActivas.delete(destino.id);
                destino.bajoAtaque = false;

                // da estado actualizado, evaluar victoria
                if (this.onBatallaResuelta) {
                    this.onBatallaResuelta();
                }
            }
        }, 300);

        return {
            exito: true,
            mensaje: `Combate iniciado en ${destino.nombre}`,
            enCombate: true,
            costo: costoEnvio,
        };
    }

    // ======================================================
    // NOMBRE: _calcularResultado
    // ENTRADA: socketId atacante, sistema origen, sistema destino, objetos atacante y defensor, cantidad de flotas
    // SALIDA: objeto con resultado detallado del combate
    // RESTRICCIONES: usar las reglas definidas en el enunciado
    // OBJETIVO: aplicar las reglas de combate y actualizar el estado del sistema
    // ======================================================
    _calcularResultado(socketId, origen, destino, atacante, defensor, cantidad) {
        const flotasDefensorasIniciales = Number(destino.flotas || 0);
        const minasIniciales = Number(destino.minas || 0);
        const fortalezasIniciales = Number(destino.fortalezas || 0);
        const astillerosAtacantesDisponibles = Number(origen?.astilleros || 0);
        const flotasAtacantesIniciales = Number(cantidad || 0);

        // Regla 1: las flotas se neutralizan 1 a 1.
        const flotasNeutralizadas = Math.min(flotasAtacantesIniciales, flotasDefensorasIniciales);
        const flotasAtacantesTrasDuelo = flotasAtacantesIniciales - flotasNeutralizadas;
        const flotasDefensorasTrasDuelo = flotasDefensorasIniciales - flotasNeutralizadas;

        let flotasDefensorasPerdidas = flotasNeutralizadas;
        let minasPerdidas = 0;
        let fortalezasPerdidas = 0;
        let flotasAtacantesUsadasContraMinas = 0;
        let astillerosAtacantesUsados = 0;
        let flotasRestantes = 0;
        let ataqueGana = false;

        if (flotasDefensorasTrasDuelo <= 0) {
            // Reglas PDF:
            // - Cada flota o astillero neutraliza 3 minas.
            // - Para derribar una fortaleza se requieren 2 astilleros.
            const unidadesParaNeutralizarMinas = Math.ceil(minasIniciales / MINAS_NEUTRALIZADAS_POR_UNIDAD_ATAQUE);
            const astillerosNecesariosFortalezas = fortalezasIniciales * UNIDADES_ATAQUE_POR_FORTALEZA;
            const astillerosNecesariosExtraMinas = Math.max(0, unidadesParaNeutralizarMinas - flotasAtacantesTrasDuelo);
            const astillerosNecesariosTotales = astillerosNecesariosFortalezas + astillerosNecesariosExtraMinas;

            ataqueGana = astillerosAtacantesDisponibles >= astillerosNecesariosTotales;

            if (ataqueGana) {
                fortalezasPerdidas = fortalezasIniciales;
                minasPerdidas = minasIniciales;

                flotasAtacantesUsadasContraMinas = Math.min(flotasAtacantesTrasDuelo, unidadesParaNeutralizarMinas);
                astillerosAtacantesUsados = astillerosNecesariosTotales;
                flotasRestantes = Math.max(0, flotasAtacantesTrasDuelo - flotasAtacantesUsadasContraMinas);

                if (origen) {
                    origen.astilleros = Math.max(0, Number(origen.astilleros || 0) - astillerosAtacantesUsados);
                }

                // El atacante conquista: mantiene flota restante y el sistema conserva centros de investigación.
                this.conquistarSistema(socketId, destino.id, { flotasRestantes });

                this._registrarEvento("owner_change", {
                    jugador: atacante.nickname,
                    mensaje: `tomó el control de ${destino.nombre}`,
                    color: "#ff6b6b",
                });

                this._registrarEvento("conquest", {
                    jugador: atacante.nickname,
                    mensaje: `conquistó ${destino.nombre} (${flotasRestantes} flotas restantes, ${astillerosAtacantesUsados} astilleros usados)` ,
                    color: "#00ff88",
                });

                this._verificarEliminacion(defensor);
            } else {
                // Defensa exitosa: se descuentan solo los elementos realmente usados.
                const fortalezasDerribadas = Math.min(
                    fortalezasIniciales,
                    Math.floor(astillerosAtacantesDisponibles / UNIDADES_ATAQUE_POR_FORTALEZA)
                );
                const astillerosUsadosFortalezas = fortalezasDerribadas * UNIDADES_ATAQUE_POR_FORTALEZA;
                const astillerosRestantes = Math.max(0, astillerosAtacantesDisponibles - astillerosUsadosFortalezas);

                const unidadesDisponiblesParaMinas = flotasAtacantesTrasDuelo + astillerosRestantes;
                const minasNeutralizadas = Math.min(
                    minasIniciales,
                    unidadesDisponiblesParaMinas * MINAS_NEUTRALIZADAS_POR_UNIDAD_ATAQUE
                );
                const unidadesUsadasParaMinas = Math.ceil(minasNeutralizadas / MINAS_NEUTRALIZADAS_POR_UNIDAD_ATAQUE);

                flotasAtacantesUsadasContraMinas = Math.min(flotasAtacantesTrasDuelo, unidadesUsadasParaMinas);
                const astillerosUsadosMinas = Math.max(0, unidadesUsadasParaMinas - flotasAtacantesUsadasContraMinas);
                astillerosAtacantesUsados = astillerosUsadosFortalezas + astillerosUsadosMinas;

                fortalezasPerdidas = fortalezasDerribadas;
                minasPerdidas = minasNeutralizadas;

                if (origen) {
                    origen.astilleros = Math.max(0, Number(origen.astilleros || 0) - astillerosAtacantesUsados);
                }

                destino.flotas = 0;
                destino.minas = Math.max(0, minasIniciales - minasPerdidas);
                destino.fortalezas = Math.max(0, fortalezasIniciales - fortalezasPerdidas);

                this._registrarEvento("battle", {
                    jugador: defensor.nickname,
                    mensaje: `defendió ${destino.nombre} contra ${atacante.nickname} (perdió ${minasPerdidas} minas y ${fortalezasPerdidas} fortalezas)`,
                    color: "#ff9d00",
                });
            }
        } else {
            // El defensor retiene flotas; no se usan minas/fortalezas en esta fase.
            destino.flotas = flotasDefensorasTrasDuelo;

            this._registrarEvento("battle", {
                jugador: defensor.nickname,
                mensaje: `contuvo el ataque en ${destino.nombre} con ${flotasDefensorasTrasDuelo} flotas restantes`,
                color: "#ff9d00",
            });
        }

        return {
            sistemaId: destino.id,
            sistemaNombre: destino.nombre,
            atacante: atacante.nickname,
            defensor: defensor.nickname,
            flotasAtacantes: cantidad,
            astillerosAtacantesDisponibles,
            astillerosAtacantesUsados,
            flotasAtacantesUsadasContraMinas,
            defensaTotal: flotasDefensorasIniciales + minasIniciales + fortalezasIniciales,
            ganador: ataqueGana ? atacante.nickname : defensor.nickname,
            derrotado: ataqueGana ? defensor.nickname : atacante.nickname,
            ataqueGana,
            planetaConquistado: ataqueGana,
            conquistador: ataqueGana ? atacante.nickname : null,
            flotasRestantes,
            flotasDefensorasPerdidas,
            minasPerdidas,
            fortalezasPerdidas,
        };
    }

    // ======================================================
    // NOMBRE: conquistarSistema
    // ENTRADA: socketId del conquistador, sistemaId, opciones (inicial, flotasRestantes)
    // SALIDA: objeto { conquistado, sistema }
    // RESTRICCIONES: jugador y sistema deben existir
    // OBJETIVO: transferir propiedad del sistema y actualizar contadores
    // ======================================================
    conquistarSistema(socketId, sistemaId, options = {}) {
        const jugador = this.jugadores.get(socketId);
        const sistema = this.sistemas.get(sistemaId);

        if (!jugador || !sistema) {
            return { conquistado: false };
        }

        const propietarioAnterior = sistema.propietarioId;

        // Quitar el sistema al propietario anterior
        if (propietarioAnterior && propietarioAnterior !== socketId) {
            const jugadorAnterior = this.jugadores.get(propietarioAnterior);
            if (jugadorAnterior) {
                jugadorAnterior.sistemas.delete(sistemaId);
                jugadorAnterior.sistemasControlados = Math.max(0, jugadorAnterior.sistemasControlados - 1);
            }

            sistema.minas      = 0;
            sistema.fortalezas = 0;
            sistema.astilleros = 0;
        }

        // Asigna nuevo propietario
        sistema.propietarioId = socketId;
        sistema.propietario   = jugador.nickname;
        sistema.flotas        = options.flotasRestantes ?? sistema.flotas ?? 0;
        sistema.bajoAtaque    = false;

        if (options.inicial) {
            sistema.baseInicialDe = socketId;
            sistema.minas         = 1;
            sistema.centrales     = 1;
            sistema.astilleros    = 1;
            sistema.fortalezas    = 0;
            sistema.flotas        = options.flotasRestantes ?? 8;
            sistema.recursos      = {
                minerales: sistema.produccion?.minerales || 0,
                energia:   sistema.produccion?.energia   || 0,
                cristales: sistema.produccion?.cristales || 0,
            };
        }

        jugador.sistemas.add(sistemaId);
        jugador.sistemasControlados = jugador.sistemas.size;

        return { conquistado: true, sistema };
    }

    // ======================================================
    // NOMBRE: _verificarEliminacion
    // ENTRADA: objeto jugador defensor
    // SALIDA: emite evento jugador_eliminado si no tiene sistemas
    // RESTRICCIONES: ninguna
    // OBJETIVO: detectar y notificar cuando un jugador pierde todos sus sistemas
    // ======================================================
    _verificarEliminacion(jugador) {
        this._reconciliarSistemasJugador(jugador);

        if (jugador.sistemas.size === 0 && !jugador.eliminado) {
            jugador.eliminado = true;

            this._registrarEvento("eliminacion", {
                jugador: jugador.nickname,
                mensaje: `${jugador.nickname} ha sido eliminado`,
                color: "#ff4444",
            });

            if (global.io && this.partida?.id) {
                global.io.to(this.partida.id).emit("jugador_eliminado", {
                    nickname: jugador.nickname,
                    socketId: jugador.socketId,
                });
            }
        }
    }

    // ======================================================
    // NOMBRE: _registrarEvento
    // ENTRADA: tipo de evento y payload con detalles
    // SALIDA: ninguna (delega al manejador externo)
    // RESTRICCIONES: onRegistrarEvento debe estar asignado por GameLogic
    // OBJETIVO: registrar eventos de combate en el log global
    // ======================================================
    _registrarEvento(tipo, payload) {
        if (this.onRegistrarEvento) {
            this.onRegistrarEvento(tipo, payload);
        }
    }

    // ======================================================
    // NOMBRE: _reconciliarSistemasJugador
    // ENTRADA: objeto jugador
    // SALIDA: actualiza jugador.sistemas y jugador.sistemasControlados según estado real
    // RESTRICCIONES: jugador debe tener socketId válido
    // OBJETIVO: evitar desincronizaciones al decidir eliminación
    // ======================================================
    _reconciliarSistemasJugador(jugador) {
        if (!jugador?.socketId) return;

        const sistemasReales = Array.from(this.sistemas.values())
            .filter((sistema) => sistema.propietarioId === jugador.socketId)
            .map((sistema) => sistema.id);

        jugador.sistemas = new Set(sistemasReales);
        jugador.sistemasControlados = jugador.sistemas.size;
    }
}

module.exports = GestorCombates;