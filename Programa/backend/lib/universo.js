const fs = require('fs');
/**
 * crearRecursosBase es una función auxiliar para inicializar los recursos de un sistema con valores por defecto.
 *
 * Nombre: crearRecursosBase
 * Entrada: ninguna
 * Salida: objeto con minerales, energía y cristales inicializados en 0
 * Restricciones: ninguna
 * Objetivo: evitar repetir la misma estructura de recursos en múltiples lugares del código
 */
function crearRecursosBase() {
    return { minerales: 0, energia: 0, cristales: 0 };
}

/**
 * esTextoValido es una función auxiliar para validar que un valor es un texto no vacío.
 *
 * Nombre: esTextoValido
 * Entrada: valor
 * Salida: true si el valor es un string no vacío, false en caso contrario
 * Restricciones: ninguna
 * Objetivo: evitar repetir la misma validación de texto en múltiples lugares del código
 */

function esTextoValido(valor) {
    return typeof valor === 'string' && valor.trim() !== '';
}

/**
 * Clase Sistema
 * Representa un sistema planetario, que es un nodo del grafo del universo.
 *
 * Nombre: Sistema
 * Entrada: mapa (definición base), estado (datos mutables), produccion (recursos por ciclo)
 * Salida: instancia de Sistema
 * Restricciones: `mapa.id` y `mapa.nombre` deben existir; `produccion` debe tener números válidos
 * Objetivo: concentrar en una sola clase la información fija y mutable de cada sistema
 */
class Sistema {
    /**
     * Crea un sistema combinando la definición base con su estado actual.
     *
     * Nombre: constructor
     * Entrada: mapa, estado, produccion
     * Salida: instancia inicializada
     * Restricciones: `mapa` debe contener al menos `id`, `nombre` y `tipo`
     * Objetivo: dejar cada sistema listo para producción y serialización
     */
    constructor(mapa, estado = {}, produccion = { minerales: 0, energia: 0, cristales: 0 }) {
        // Propiedades fijas del sistema    
        this.id = mapa.id;
        this.nombre = mapa.nombre;
        this.descripcion = mapa.descripcion || '';
        this.tipo = mapa.tipo;
        // Propiedades mutables del sistema
        this.propietario = estado.dueno ?? null;
        this.flotasEstacionadas = estado.flotasEstacionadas ?? 0;
        this.instalaciones = Array.isArray(estado.instalaciones) ? estado.instalaciones : [];
        this.nivel = estado.nivel ?? 1;
        this.defensa = estado.defensa ?? 0;
        this.estadoExploracion = estado.estadoExploracion || 'no explorado';
        // Recursos actuales del sistema, inicializados con el estado o con valores base
        this.recursos = Object.assign(crearRecursosBase(), estado.recursos || {});
        this.produccionPorCiclo = Object.assign(crearRecursosBase(), produccion || {});
    }

    /**
     * Aplica la producción de recursos de este sistema.
     *
     * Nombre: aplicarProduccion
     * Entrada: ninguna
     * Salida: modifica `this.recursos`
     * Restricciones: la producción por ciclo debe contener números
     * Objetivo: sumar recursos al pasar un ciclo de juego
     */
    aplicarProduccion() {
        this.recursos.minerales += this.produccionPorCiclo.minerales || 0;
        this.recursos.energia += this.produccionPorCiclo.energia || 0;
        this.recursos.cristales += this.produccionPorCiclo.cristales || 0;
    }

    /**
     * Convierte el sistema en un objeto plano para responder por HTTP o Socket.IO.
     *
     * Nombre: convertirADTO
     * Entrada: ninguna
     * Salida: objeto serializable
     * Restricciones: no modifica el estado interno
     * Objetivo: enviar al cliente una versión segura y simple del sistema
     */
    convertirADTO() {
        return {
            id: this.id,
            nombre: this.nombre,
            descripcion: this.descripcion,
            tipo: this.tipo,
            propietario: this.propietario,
            flotasEstacionadas: this.flotasEstacionadas,
            instalaciones: this.instalaciones,
            nivel: this.nivel,
            defensa: this.defensa,
            estadoExploracion: this.estadoExploracion,
            recursos: this.recursos
        };
    }

}

/**
 * Clase Universo
 * Encapsula el grafo del juego: sistemas planetarios y rutas espaciales.
 *
 * Nombre: Universo
 * Entrada: mapa (definición base), estadoBase (estado inicial mutable)
 * Salida: instancia con sistemas cargados en memoria
 * Restricciones: los JSON deben tener la estructura esperada
 * Objetivo: centralizar la lógica del universo y su producción automática
 */
class Universo {
    /**
     * Construye el universo combinando mapa y estado.
     *
     * Nombre: constructor
     * Entrada: mapa, estadoBase
     * Salida: instancia lista para jugar
     * Restricciones: `mapa.sistemas` debe ser un arreglo
     * Objetivo: crear el universo completo en memoria
     */
    constructor(mapa, estadoBase) {
        // Propiedades generales del universo
        this.nombre = mapa?.nombre || (estadoBase?.nombre || 'Universo');
        this.cicloProduccionSegundos = mapa?.cicloProduccionSegundos ?? 20;
        this.tipos = mapa?.tipos || {};
        this.rutas = mapa?.rutas || [];
        // Mapa de sistemas por su identificador
        this.sistemas = new Map();
        // Crear un índice de estado por id para asignar a cada sistema
        const estadoPorId = this._crearEstadoPorId(estadoBase);
        const sistemasBase = Array.isArray(mapa?.sistemas) ? mapa.sistemas : [];

        for (const definicionSistema of sistemasBase) {
            const sistema = this._crearSistema(definicionSistema, estadoPorId);
            this.sistemas.set(sistema.id, sistema);
        }

        this.identificadorIntervalo = null;
    }

    /**
     * Convierte la lista de estados en un mapa por identificador.
     *
     * Nombre: _crearEstadoPorId
     * Entrada: estadoBase
     * Salida: objeto con estados indexados por id
     * Restricciones: el estado puede venir vacío
     * Objetivo: buscar cada sistema de forma simple
     */
    _crearEstadoPorId(estadoBase) {
        const estadoPorId = {};

        for (const sistema of estadoBase?.sistemas || []) {
            estadoPorId[sistema.id] = sistema;
        }

        return estadoPorId;
    }

    /**
     * Crea un sistema con su estado y su producción.
     *
     * Nombre: _crearSistema
     * Entrada: definicionSistema, estadoPorId
     * Salida: instancia de Sistema
     * Restricciones: la definición debe tener id y tipo
     * Objetivo: concentrar en una sola línea cómo se arma cada nodo
     */
    _crearSistema(definicionSistema, estadoPorId) {
        const estadoSistema = estadoPorId[definicionSistema.id] || {};
        const produccionSistema = this.tipos[definicionSistema.tipo] || crearRecursosBase();

        return new Sistema(definicionSistema, estadoSistema, produccionSistema);
    }

    /**
     * Devuelve una versión serializable de todo el universo.
     *
     * Nombre: convertirADTO
     * Entrada: ninguna
     * Salida: objeto plano con nombre, ciclo, sistemas y rutas
     * Restricciones: no debe mutar el universo
     * Objetivo: responder al cliente con la vista actual del mundo
     */
    convertirADTO() {
        return {
            nombre: this.nombre,
            cicloProduccionSegundos: this.cicloProduccionSegundos,
            sistemas: Array.from(this.sistemas.values()).map((sistema) => sistema.convertirADTO()),// Convertir el mapa de sistemas a un arreglo de DTOs
            rutas: this.rutas
        };
    }

    /**
     * Obtiene un sistema por su identificador.
     *
     * Nombre: obtenerSistemaDTO
     * Entrada: idSistema (string)
     * Salida: objeto del sistema o null
     * Restricciones: el sistema debe existir en el mapa interno
     * Objetivo: consultar un sistema concreto desde HTTP
     */
    obtenerSistemaDTO(idSistema) {
        const sistema = this.sistemas.get(idSistema);
        return sistema ? sistema.convertirADTO() : null;    // Devuelve null si no se encuentra el sistema
    }

    /**
     * Aplica producción a todos los sistemas.
     *
     * Nombre: ejecutarProduccion
     * Entrada: ninguna
     * Salida: modifica el estado interno de recursos
     * Restricciones: cada sistema debe tener producción configurada
     * Objetivo: simular el paso del tiempo en el universo
     */
    ejecutarProduccion() {
        this.sistemas.forEach((sistema) => sistema.aplicarProduccion());// Aplica la producción a cada sistema del universo
    }

    /**
     * Inicia el ciclo automático de producción.
     *
     * Nombre: iniciar
     * Entrada: servidorSocket (opcional)
     * Salida: inicia un intervalo interno
     * Restricciones: solo debe iniciarse una vez
     * Objetivo: actualizar recursos automáticamente cada ciclo configurado
     */
    iniciar(servidorSocket) {
        if (this.identificadorIntervalo) {
            return;
        }

        const intervaloMilisegundos = Math.max(1, Number(this.cicloProduccionSegundos || 20)) * 1000;// Convierte el ciclo de producción a milisegundos, con un mínimo de 1 segundo

        this.identificadorIntervalo = setInterval(() => {
            this.ejecutarProduccion();

            if (servidorSocket) {
                servidorSocket.emit('produccion', {
                    timestamp: Date.now(),
                    sistemas: Array.from(this.sistemas.values()).map((sistema) => ({// Solo enviamos el id y los recursos actualizados para cada sistema
                        id: sistema.id,
                        recursos: sistema.recursos
                    }))
                });

                servidorSocket.emit('universo', this.convertirADTO());
            }
        }, intervaloMilisegundos);
    }

    /**
     * Detiene el ciclo automático de producción.
     *
     * Nombre: detener
     * Entrada: ninguna
     * Salida: limpia el intervalo interno
     * Restricciones: el intervalo debe haber sido iniciado
     * Objetivo: permitir apagar el ciclo en pruebas o cierre del servidor
     */
    detener() {
        if (this.identificadorIntervalo) {
            clearInterval(this.identificadorIntervalo);// Detiene el intervalo de producción
            this.identificadorIntervalo = null;
        }
    }

    /**
     * Calcula un ranking simple por propietario.
     *
     * Nombre: obtenerRanking
     * Entrada: ninguna
     * Salida: arreglo ordenado con puntos y sistemas controlados
     * Restricciones: solo cuenta sistemas con propietario asignado
     * Objetivo: mostrar un ranking rápido en el cliente
     */
    obtenerRanking() {
        const rankingPorPropietario = new Map();

        for (const sistema of this.sistemas.values()) {
            if (!sistema.propietario) {
                continue;
            }
            // Para cada sistema con propietario, acumulamos puntos y sistemas controlados en el ranking
            const nombreJugador = sistema.propietario;
            const acumulado = rankingPorPropietario.get(nombreJugador) || this._crearEntradaRanking(nombreJugador);

            acumulado.sistemasControlados += 1;
            acumulado.puntos += sistema.nivel || 1;
            rankingPorPropietario.set(nombreJugador, acumulado);
        }

        return Array.from(rankingPorPropietario.values()).sort(// Ordenamos el ranking por puntos y luego por sistemas controlados
            (a, b) => b.puntos - a.puntos || b.sistemasControlados - a.sistemasControlados
        );
    }

    /**
     * Crea una fila inicial del ranking.
     *
     * Nombre: _crearEntradaRanking
     * Entrada: nombreJugador
     * Salida: objeto ranking base
     * Restricciones: el nombre debe existir
     * Objetivo: evitar repetir la misma estructura en el cálculo
     */
    _crearEntradaRanking(nombreJugador) {
        return {
            jugador: nombreJugador,
            sistemasControlados: 0,
            puntos: 0
        };
    }

    /**
     * Carga un universo directamente desde archivos JSON.
     *
     * Nombre: cargarDesdeArchivos
     * Entrada: rutaMapa, rutaEstado
     * Salida: instancia de Universo
     * Restricciones: ambas rutas deben apuntar a JSON válidos
     * Objetivo: facilitar pruebas y arranque directo desde disco
     */
    static cargarDesdeArchivos(rutaMapa, rutaEstado) {
        const mapa = JSON.parse(fs.readFileSync(rutaMapa, 'utf8'));// Carga el mapa base desde el archivo JSON
        const estado = JSON.parse(fs.readFileSync(rutaEstado, 'utf8'));// Carga el estado inicial desde el archivo JSON
        return new Universo(mapa, estado);// Crea una instancia de Universo combinando ambos archivos
    }
}

/**
 * Clase GestorPartidas
 * Gestiona partidas en memoria.
 *
 * Nombre: GestorPartidas
 * Entrada: ninguna
 * Salida: instancia con un mapa de partidas
 * Restricciones: trabaja solo en memoria
 * Objetivo: crear, listar y unir jugadores a partidas
 */
class GestorPartidas {
    constructor() {// Mapa de partidas por su identificador
        this.partidas = new Map();
        this.contadorPartidas = 1;
    }

    /**
     * Genera un identificador para una partida.
     *
     * Nombre: generarIdentificador
     * Entrada: ninguna
     * Salida: string único
     * Restricciones: el contador se reinicia si el servidor se apaga
     * Objetivo: crear identificadores cortos y fáciles de leer
     */
    generarIdentificador() {
        const numero = String(this.contadorPartidas).padStart(3, '0');// Genera un número con ceros a la izquierda, por ejemplo "001", "002", etc.
        this.contadorPartidas += 1;
        return `P${numero}`;
    }

    /**
     * Comprueba si el texto recibido sirve como nombre.
     *
     * Nombre: _esTextoValido
     * Entrada: valor
     * Salida: true o false
     * Restricciones: se usa para nombres de partida y jugador
     * Objetivo: dejar más clara la validación en crear y unirse
     */
    _esTextoValido(valor) {
        return esTextoValido(valor);
    }

    /**
     * Crea una partida nueva.
     *
     * Nombre: crear
     * Entrada: nombrePartida, jugadorCreador
     * Salida: objeto partida creado
     * Restricciones: ambos parámetros deben venir con texto
     * Objetivo: permitir al cliente iniciar una nueva partida
     */
    crear(nombrePartida, jugadorCreador) {
        if (!this._esTextoValido(nombrePartida) || !this._esTextoValido(jugadorCreador)) {
            return null;
        }

        const identificadorPartida = this.generarIdentificador();
        const partida = {
            id: identificadorPartida,
            nombre: nombrePartida.trim(),
            creador: jugadorCreador.trim(),
            jugadores: [jugadorCreador.trim()],
            creadaEn: new Date().toISOString()
        };

        this.partidas.set(identificadorPartida, partida);
        return partida;
    }

    /**
     * Lista todas las partidas existentes.
     *
     * Nombre: listar
     * Entrada: ninguna
     * Salida: arreglo de partidas
     * Restricciones: depende del estado en memoria
     * Objetivo: mostrar partidas disponibles al cliente
     */
    listar() {
        return Array.from(this.partidas.values());// Devuelve un arreglo con todas las partidas del mapa
    }

    /**
     * Agrega un jugador a una partida existente.
     *
     * Nombre: unirse
     * Entrada: idPartida, nombreJugador
     * Salida: partida actualizada o null
     * Restricciones: la partida debe existir
     * Objetivo: permitir a un jugador entrar a una partida ya creada
     */
    unirse(idPartida, nombreJugador) {
        const partida = this.partidas.get(idPartida);
        // Si la partida no existe, devuelve null
        if (!partida) {
            return null;
        }
        // Valida el nombre del jugador antes de agregarlo a la partida
        if (!this._esTextoValido(nombreJugador)) {
            return null;
        }
        // Normaliza el nombre del jugador para evitar espacios innecesarios
        const nombreNormalizado = nombreJugador.trim();

        if (!partida.jugadores.includes(nombreNormalizado)) {
            partida.jugadores.push(nombreNormalizado);
        }

        return partida;
    }
}

module.exports = { Sistema, Universo, GestorPartidas };
