// ======================================================
// NOMBRE: Combates
// ENTRADA: datos del atacante, defensor, sistema destino y flotas
// SALIDA: resultado del combate y nuevo estado del sistema
// OBJETIVO: resolver enfrentamientos y conquistas entre jugadores
// ======================================================

const DEFENSA_POR_MINA = 3;
const DEFENSA_POR_FORTALEZA = 2;

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
            global.io.to(this.partida.id).emit("battle_start", {
                sistemaId: destino.id,
                sistemaNombre: destino.nombre,
                atacante: atacante.nickname,
                defensor: defensor.nickname,
                flotasAtacantes: cantidad,
                defensa: {
                    flotas: destino.flotas,
                    minas: destino.minas,
                    fortalezas: destino.fortalezas,
                },
            });
        }

        setTimeout(() => {
            let resultado = null;

            try {
                resultado = this._calcularResultado(socketId, destino, atacante, defensor, cantidad);
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
                }

                this.batallasActivas.delete(destino.id);
                destino.bajoAtaque = false;

                // da estado actualizado, evaluar victoria
                if (this.onBatallaResuelta) {
                    this.onBatallaResuelta();
                }
            }
        }, 1800);

        return {
            exito: true,
            mensaje: `Combate iniciado en ${destino.nombre}`,
            enCombate: true,
            costo: costoEnvio,
        };
    }

    // ======================================================
    // NOMBRE: _calcularResultado
    // ENTRADA: socketId atacante, sistema destino, objetos atacante y defensor, cantidad de flotas
    // SALIDA: objeto con resultado detallado del combate
    // RESTRICCIONES: usar las reglas definidas en el enunciado
    // OBJETIVO: aplicar las reglas de combate y actualizar el estado del sistema
    // ======================================================
    _calcularResultado(socketId, destino, atacante, defensor, cantidad) {
        const flotasDefensoras = destino.flotas || 0;
        const defensaMinas = (destino.minas || 0) * DEFENSA_POR_MINA;
        const defensaFortalezas = (destino.fortalezas || 0) * DEFENSA_POR_FORTALEZA;
        const defensaTotal = flotasDefensoras + defensaMinas + defensaFortalezas;

        const fuerzaAtaque = cantidad;
        const ataqueGana = fuerzaAtaque > defensaTotal;
        const flotasRestantes = ataqueGana ? fuerzaAtaque - defensaTotal : 0;

        if (ataqueGana) {
            // El atacante conquista: mantiene flotas restantes y centros de investigación
            // Las minas y fortalezas del defensor se pierden
            this.conquistarSistema(socketId, destino.id, { flotasRestantes });

            this._registrarEvento("conquest", {
                jugador: atacante.nickname,
                mensaje: `derrotó a ${defensor.nickname} y conquistó ${destino.nombre} con ${flotasRestantes} flotas restantes`,
                color: "#00ff88",
            });

            // Verificar si el defensor fue eliminado
            this._verificarEliminacion(defensor);

        } else {
            // El defensor gana: pierde parte de sus defensas pero conserva el sistema
            const flotasAtacanteUsadas = Math.floor(fuerzaAtaque / 2);
            destino.flotas    = Math.max(0, (destino.flotas    || 0) - flotasAtacanteUsadas);
            destino.minas     = Math.max(0, (destino.minas     || 0) - Math.floor(fuerzaAtaque / 3));
            destino.fortalezas = Math.max(0, (destino.fortalezas || 0) - Math.floor(fuerzaAtaque / 2));

            this._registrarEvento("battle", {
                jugador: defensor.nickname,
                mensaje: `defendió ${destino.nombre} contra ${atacante.nickname}`,
                color: "#ff9d00",
            });
        }

        return {
            sistemaId: destino.id,
            sistemaNombre: destino.nombre,
            atacante: atacante.nickname,
            defensor: defensor.nickname,
            flotasAtacantes: cantidad,
            defensaTotal,
            ganador: ataqueGana ? atacante.nickname : defensor.nickname,
            derrotado: ataqueGana ? defensor.nickname : atacante.nickname,
            ataqueGana,
            planetaConquistado: ataqueGana,
            conquistador: ataqueGana ? atacante.nickname : null,
            flotasRestantes,
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
}

module.exports = GestorCombates;