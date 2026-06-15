// ======================================================
// NOMBRE: Lógica del Juego (GameLogic)
// ENTRADA: datos de la partida, acciones de jugadores
// SALIDA: estado actualizado, eventos de juego
// OBJETIVO: Manejar toda la lógica de gameplay
// ======================================================

const COSTOS_CONSTRUCCION = {
    mina: { minerales: 100, energia: 0, cristales: 0 },
    central: { minerales: 80, energia: 50, cristales: 200 },
    astillero: { minerales: 150, energia: 100, cristales: 10 },
    fortaleza: { minerales: 200, energia: 100, cristales: 30 },
};

const PRODUCCION_CENTRAL = {
    minerales: 50,
    energia: 25,
    cristales: 10,
};

const DEFENSA_POR_MINA = 3;
const DEFENSA_POR_FORTALEZA = 2;
const COSTO_ENVIO_POR_FLOTA = {
    minerales: 3,
    energia: 5,
    cristales: 1,
};

class LogicaJuego {
    constructor(partida, options = {}) {
    this.partida = partida;
    this.jugadores = new Map();
    this.sistemas = new Map();
    this.rutas = new Map();
    this.eventos = [];
    this.estado = "jugando";
    this.porcentajeVictoria = options.porcentajeVictoria ?? 0.6;
    this.intervaloProduccionMs = options.intervaloProduccionMs ?? 20000;
    this.tiempoProduccionRestante = Math.floor(this.intervaloProduccionMs / 1000);
    this.intervaloTimer = null;
    this.intervaloCuentaRegresivaInicio = null;
    this.batallasActivas = new Set();
    this.ganador = null;
    this.inicioHabilitado = false;
    this.inicioEnProceso = false;
    }

  // ======================================================
  // NOMBRE: inicializar
  // ENTRADA: lista de jugadores con socketId y nickname
  // SALIDA: mapas internos de sistemas, rutas y jugadores listos
  // RESTRICCIONES: galaxia y jugadores válidos en la partida
  // OBJETIVO: preparar todo el estado inicial del juego
  // ======================================================
    inicializar(jugadoresData) {
    this._cargarSistemas();
    this._cargarRutas();
    this._inicializarJugadores(jugadoresData);
    this._asignarSistemasIniciales();
    }

    _cargarSistemas() {
    this.sistemas.clear();
    const sistemasOriginales = this.partida.galaxia?.sistemas || [];

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
        produccion: { ...(sistema.produccion || this._produccionPorTipo(sistema.tipo)) },
        flotas: 0,
        minas: 0,
        centrales: 0,
        astilleros: 0,
        fortalezas: 0,
        bajoAtaque: false,
        });
    });
    }

    _cargarRutas() {
    this.rutas.clear();
    const rutasOriginales = this.partida.galaxia?.rutas || [];

    rutasOriginales.forEach(([origen, destino]) => {
        if (!this.rutas.has(origen)) this.rutas.set(origen, new Set());
        if (!this.rutas.has(destino)) this.rutas.set(destino, new Set());
        this.rutas.get(origen).add(destino);
        this.rutas.get(destino).add(origen);
    });
    }

    _inicializarJugadores(jugadoresData) {
    this.jugadores.clear();

    jugadoresData.forEach((jugador) => {
        this.jugadores.set(jugador.socketId, {
        socketId: jugador.socketId,
        nickname: jugador.nickname,
        sistemaInicialId: null,
        recursos: {
            minerales: 300,
            energia: 150,
            cristales: 50,
        },
        sistemas: new Set(),
        sistemasControlados: 0,
        eliminado: false,
        });
    });
    }

    _asignarSistemasIniciales() {
    const jugadores = Array.from(this.jugadores.values());
    const sistemas = Array.from(this.sistemas.values());
    const sistemasDisponibles = [...sistemas];

    jugadores.forEach((jugador, index) => {
        const sistemaBase = sistemasDisponibles[index];
        if (!sistemaBase) return;
        jugador.sistemaInicialId = sistemaBase.id;
        this._conquistarSistema(jugador.socketId, sistemaBase.id, {
        inicial: true,
        flotasRestantes: 8,
        });
    });
    }

    _produccionPorTipo(tipo) {
    const producciones = {
        minero: { minerales: 100, energia: 30, cristales: 10 },
        energetico: { minerales: 50, energia: 50, cristales: 10 },
        cientifico: { minerales: 40, energia: 40, cristales: 30 },
        balanceado: { minerales: 35, energia: 35, cristales: 35 },
    };

    return producciones[tipo] || producciones.balanceado;
    }

    _getJugador(socketId) {
    return this.jugadores.get(socketId) || null;
    }

    _getSistema(sistemaId) {
    return this.sistemas.get(sistemaId) || null;
    }

    reasignarSocketJugador(oldSocketId, newSocketId, nickname) {
    if (!newSocketId) return false;

    let jugador = this.jugadores.get(oldSocketId);
    let sourceSocketId = oldSocketId;

    if (!jugador && nickname) {
        const encontrado = Array.from(this.jugadores.values()).find((item) => item.nickname === nickname);
        if (!encontrado) return false;
        jugador = encontrado;
        sourceSocketId = encontrado.socketId;
    }

    if (!jugador) return false;
    if (sourceSocketId === newSocketId) return true;

    this.jugadores.delete(sourceSocketId);
    jugador.socketId = newSocketId;
    this.jugadores.set(newSocketId, jugador);

    this.sistemas.forEach((sistema) => {
        if (sistema.propietarioId === sourceSocketId) {
        sistema.propietarioId = newSocketId;
        }
        if (sistema.baseInicialDe === sourceSocketId) {
        sistema.baseInicialDe = newSocketId;
        }
    });

    return true;
    }

    _registrarEvento(tipo, payload) {
    const evento = {
        tipo,
        hora: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        ...payload,
    };

    this.eventos.unshift(evento);
    this.eventos = this.eventos.slice(0, 25);
    return evento;
    }

    _emitirEstado() {
    if (!global.io || !this.partida?.id) return;
    global.io.to(this.partida.id).emit("game_state_update", this.obtenerEstadoPartida());
    }

    _emitirTimer() {
    if (!global.io || !this.partida?.id) return;
    global.io.to(this.partida.id).emit("production_timer", {
        segundosRestantes: this.tiempoProduccionRestante,
        intervalo: this.intervaloProduccionMs,
    });
    }

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
            const sistemaVecino = this._getSistema(vecino);
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
  // NOMBRE: iniciarProduccion
  // ENTRADA: sin entrada explícita (usa configuración interna)
  // SALIDA: temporizador activo y eventos production_timer
  // RESTRICCIONES: solo un temporizador activo por partida
  // OBJETIVO: ejecutar ciclos periódicos de producción
  // ======================================================
    iniciarProduccion() {
    this.detener();

    this.intervaloTimer = setInterval(() => {
        if (!this.inicioHabilitado) {
        this._emitirTimer();
        return;
        }

        this.tiempoProduccionRestante -= 1;
        if (this.tiempoProduccionRestante < 0) {
        this._aplicarProduccion();
        this.tiempoProduccionRestante = Math.floor(this.intervaloProduccionMs / 1000);
        }
        this._emitirTimer();
    }, 1000);

    this._emitirTimer();
    }

    iniciarConTeclaU(socketId) {
    if (this.estado === "finalizada") {
        return { exito: false, mensaje: "La partida ya finalizó" };
    }

    const jugador = this._getJugador(socketId);
    if (!jugador) {
        return { exito: false, mensaje: "Jugador no encontrado" };
    }

    if (this.inicioHabilitado) {
        return { exito: false, mensaje: "La partida ya está iniciada" };
    }

    if (this.inicioEnProceso) {
        return { exito: false, mensaje: "La cuenta regresiva ya está en curso" };
    }

    this.inicioEnProceso = true;
    let segundosRestantes = 3;

    if (global.io && this.partida?.id) {
        global.io.to(this.partida.id).emit("countdown_inicio_u", {
        segundosRestantes,
        jugador: jugador.nickname,
        });
    }

    this.intervaloCuentaRegresivaInicio = setInterval(() => {
        segundosRestantes -= 1;

        if (segundosRestantes <= 0) {
        clearInterval(this.intervaloCuentaRegresivaInicio);
        this.intervaloCuentaRegresivaInicio = null;
        this.inicioHabilitado = true;
        this.inicioEnProceso = false;

        this._registrarEvento("system", {
            jugador: "Sistema",
            mensaje: `Inicio habilitado por ${jugador.nickname}. La partida ya está activa.`,
            color: "#f6d365",
        });

        if (global.io && this.partida?.id) {
            global.io.to(this.partida.id).emit("inicio_u_completado", {
            mensaje: "La partida está en marcha",
            });
        }

        this._emitirEstado();
        this._emitirTimer();
        return;
        }

        if (global.io && this.partida?.id) {
        global.io.to(this.partida.id).emit("countdown_inicio_u", {
            segundosRestantes,
            jugador: jugador.nickname,
        });
        }
    }, 1000);

    return { exito: true, mensaje: `Cuenta regresiva iniciada por ${jugador.nickname}` };
    }

    _aplicarProduccion() {
    this.jugadores.forEach((jugador, socketId) => {
        const sistemasControlados = Array.from(this.sistemas.values()).filter(
        (sistema) => sistema.propietarioId === socketId
        );

        sistemasControlados.forEach((sistema) => {
        const minas = sistema.minas || 0;
        const centrales = sistema.centrales || 0;

        jugador.recursos.minerales += sistema.produccion.minerales + minas * 10 + centrales * PRODUCCION_CENTRAL.minerales;
        jugador.recursos.energia += sistema.produccion.energia + minas * 5 + centrales * PRODUCCION_CENTRAL.energia;
        jugador.recursos.cristales += sistema.produccion.cristales + centrales * PRODUCCION_CENTRAL.cristales;

        sistema.recursos.minerales += sistema.produccion.minerales;
        sistema.recursos.energia += sistema.produccion.energia;
        sistema.recursos.cristales += sistema.produccion.cristales;
        });
    });

    this._registrarEvento("production", {
        jugador: "Sistema",
        mensaje: "Producción generada en todos los sistemas controlados",
        color: "#00ff88",
    });

    this._emitirEstado();
    this._evaluarVictoria();
    }

  // ======================================================
  // NOMBRE: construir
  // ENTRADA: socketId del jugador, sistema destino y tipo de edificio
  // SALIDA: resultado de éxito/error + estado actualizado
  // RESTRICCIONES: sistema propio, recursos suficientes y sin ataque
  // OBJETIVO: ampliar infraestructura del jugador
  // ======================================================
    construir(socketId, sistemaId, tipoEdificio) {
    const jugador = this._getJugador(socketId);
    const sistema = this._getSistema(sistemaId);

    if (!jugador) return { exito: false, mensaje: "Jugador no encontrado" };
    if (!this.inicioHabilitado) return { exito: false, mensaje: "Presiona U para iniciar la partida" };
    if (!sistema) return { exito: false, mensaje: "Sistema no encontrado" };
    if (sistema.propietarioId !== socketId) return { exito: false, mensaje: "Solo puedes construir en tus sistemas" };
    if (sistema.bajoAtaque) return { exito: false, mensaje: "El sistema está siendo atacado" };

    const costo = COSTOS_CONSTRUCCION[tipoEdificio];
    if (!costo) return { exito: false, mensaje: "Tipo de edificio inválido" };

    const tieneRecursos =
        jugador.recursos.minerales >= costo.minerales &&
        jugador.recursos.energia >= costo.energia &&
        jugador.recursos.cristales >= costo.cristales;

    if (!tieneRecursos) {
        return {
        exito: false,
        mensaje: `Recursos insuficientes para ${tipoEdificio}. Necesitas ${costo.minerales}M/${costo.energia}E/${costo.cristales}C y tienes ${jugador.recursos.minerales}M/${jugador.recursos.energia}E/${jugador.recursos.cristales}C`,
        };
    }

    jugador.recursos.minerales -= costo.minerales;
    jugador.recursos.energia -= costo.energia;
    jugador.recursos.cristales -= costo.cristales;

    if (tipoEdificio === "mina") sistema.minas += 1;
    if (tipoEdificio === "central") sistema.centrales += 1;
    if (tipoEdificio === "astillero") sistema.astilleros += 1;
    if (tipoEdificio === "fortaleza") sistema.fortalezas += 1;

    this._registrarEvento("build", {
        jugador: jugador.nickname,
        mensaje: `construyó ${tipoEdificio} en ${sistema.nombre}`,
        color: "#00ff88",
    });

    this._emitirEstado();
    this._evaluarVictoria();

    return { exito: true, mensaje: `${tipoEdificio} construido en ${sistema.nombre}` };
    }

  // ======================================================
  // NOMBRE: enviarFlotas
  // ENTRADA: socketId, sistema origen, sistema destino y cantidad
  // SALIDA: traslado, conquista o combate según el destino
  // RESTRICCIONES: ruta válida, flotas disponibles y costo pagable
  // OBJETIVO: permitir expansión y combate de forma iterativa
  // ======================================================
    enviarFlotas(socketId, origenId, destinoId, cantidad) {
    const jugador = this._getJugador(socketId);
    const origen = this._getSistema(origenId);
    const destino = this._getSistema(destinoId);
    const cantidadFlotas = Math.floor(Number(cantidad) || 0);

    if (!jugador) return { exito: false, mensaje: "Jugador no encontrado" };
    if (!this.inicioHabilitado) return { exito: false, mensaje: "Presiona U para iniciar la partida" };
    if (!origen || !destino) return { exito: false, mensaje: "Origen o destino inválido" };
    if (origen.propietarioId !== socketId) return { exito: false, mensaje: "Solo puedes enviar desde tus sistemas" };
    if (origen.bajoAtaque || destino.bajoAtaque) return { exito: false, mensaje: "El sistema está siendo atacado" };
    if (!this._hayRutaValida(origenId, destinoId, socketId)) return { exito: false, mensaje: "No existe una ruta válida" };

    const flotasDisponibles = origen.flotas || 0;
    if (cantidadFlotas <= 0 || cantidadFlotas > flotasDisponibles) {
        return { exito: false, mensaje: "Flotas insuficientes" };
    }

    const costoEnvio = {
      minerales: COSTO_ENVIO_POR_FLOTA.minerales * cantidadFlotas,
      energia: COSTO_ENVIO_POR_FLOTA.energia * cantidadFlotas,
      cristales: COSTO_ENVIO_POR_FLOTA.cristales * cantidadFlotas,
    };

    const puedePagarEnvio =
        jugador.recursos.minerales >= costoEnvio.minerales &&
        jugador.recursos.energia >= costoEnvio.energia &&
        jugador.recursos.cristales >= costoEnvio.cristales;

    if (!puedePagarEnvio) {
        return {
        exito: false,
        mensaje: `Recursos insuficientes para mover ${cantidadFlotas} flotas (costo: ${costoEnvio.minerales}M / ${costoEnvio.energia}E / ${costoEnvio.cristales}C)`,
        };
    }

    jugador.recursos.minerales -= costoEnvio.minerales;
    jugador.recursos.energia -= costoEnvio.energia;
    jugador.recursos.cristales -= costoEnvio.cristales;

    origen.flotas -= cantidadFlotas;

    this._registrarEvento("fleet", {
        jugador: jugador.nickname,
        mensaje: `envió ${cantidadFlotas} flotas de ${origen.nombre} a ${destino.nombre} (costo ${costoEnvio.minerales}/${costoEnvio.energia}/${costoEnvio.cristales})`,
        color: "#00aaff",
    });

    if (destino.propietarioId === socketId) {
        destino.flotas = (destino.flotas || 0) + cantidadFlotas;
        this._emitirEstado();
        this._evaluarVictoria();
        return {
        exito: true,
        mensaje: `Flotas trasladadas a ${destino.nombre}`,
        costo: costoEnvio,
        };
    }

    if (destino.propietarioId && destino.propietarioId !== socketId) {
        return this._resolverAtaque(socketId, origen, destino, cantidadFlotas);
    }

    destino.bajoAtaque = true;
    const conquista = this._conquistarSistema(socketId, destinoId, {
        flotasRestantes: cantidadFlotas,
    });
    destino.bajoAtaque = false;

    this._registrarEvento("conquest", {
        jugador: jugador.nickname,
        mensaje: conquista.conquistado
        ? `conquistó ${destino.nombre}`
        : `no logró conquistar ${destino.nombre}`,
        color: conquista.conquistado ? "#00ff88" : "#ff4444",
    });

    this._emitirEstado();
    this._evaluarVictoria();

    return {
        exito: true,
        mensaje: conquista.conquistado ? `Sistema conquistado: ${destino.nombre}` : `Sistema defendido: ${destino.nombre}`,
        batalla: conquista,
        costo: costoEnvio,
    };
    }

    _resolverAtaque(socketId, origen, destino, cantidad) {
    const atacante = this._getJugador(socketId);
    const defensor = this._getJugador(destino.propietarioId);

    if (!atacante || !defensor) {
        return { exito: false, mensaje: "No se pudo resolver el combate" };
    }

    if (this.batallasActivas.has(destino.id)) {
        return { exito: false, mensaje: "El destino ya está siendo atacado" };
    }

    this.batallasActivas.add(destino.id);
    destino.bajoAtaque = true;

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
        const defensaBase = (destino.flotas || 0) + (destino.minas || 0) * DEFENSA_POR_MINA + (destino.fortalezas || 0) * DEFENSA_POR_FORTALEZA;
        const fuerzaAtaque = cantidad;
        const ataqueGana = fuerzaAtaque > defensaBase;
        const flotasRestantes = ataqueGana ? fuerzaAtaque - defensaBase : 0;

        if (ataqueGana) {
            this._conquistarSistema(socketId, destino.id, { flotasRestantes });
            this._registrarEvento("conquest", {
            jugador: atacante.nickname,
            mensaje: `derrotó a ${defensor.nickname} y conquistó ${destino.nombre}`,
            color: "#00ff88",
            });
        } else {
            destino.flotas = Math.max(0, (destino.flotas || 0) - Math.floor(fuerzaAtaque / 2));
            destino.minas = Math.max(0, (destino.minas || 0) - Math.floor(fuerzaAtaque / 3));
            destino.fortalezas = Math.max(0, (destino.fortalezas || 0) - Math.floor(fuerzaAtaque / 2));
            this._registrarEvento("battle", {
            jugador: defensor.nickname,
            mensaje: `defendió ${destino.nombre} y derrotó a ${atacante.nickname}`,
            color: "#ff9d00",
            });
        }

        resultado = {
            sistemaId: destino.id,
            sistemaNombre: destino.nombre,
            atacante: atacante.nickname,
            defensor: defensor.nickname,
            flotasAtacantes: cantidad,
            defensaTotal: defensaBase,
            ganador: ataqueGana ? atacante.nickname : defensor.nickname,
            derrotado: ataqueGana ? defensor.nickname : atacante.nickname,
            ataqueGana,
            planetaConquistado: ataqueGana,
            conquistador: ataqueGana ? atacante.nickname : null,
            flotasRestantes,
        };
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
        this._emitirEstado();
        this._evaluarVictoria();
        }
    }, 1800);

    return {
        exito: true,
        mensaje: `Combate iniciado en ${destino.nombre}`,
        enCombate: true,
    };
    }

    _conquistarSistema(socketId, sistemaId, options = {}) {
    const jugador = this._getJugador(socketId);
    const sistema = this._getSistema(sistemaId);

    if (!jugador || !sistema) {
        return { conquistado: false };
    }

    const propietarioAnterior = sistema.propietarioId;
    if (propietarioAnterior && propietarioAnterior !== socketId) {
        const jugadorAnterior = this._getJugador(propietarioAnterior);
        if (jugadorAnterior) {
        jugadorAnterior.sistemas.delete(sistemaId);
        jugadorAnterior.sistemasControlados = Math.max(0, jugadorAnterior.sistemasControlados - 1);
        }
    }

    sistema.propietarioId = socketId;
    sistema.propietario = jugador.nickname;
    sistema.flotas = options.flotasRestantes ?? sistema.flotas ?? 0;
    sistema.bajoAtaque = false;

    if (options.inicial) {
        sistema.baseInicialDe = socketId;
        sistema.minas = 1;
        sistema.centrales = 1;
        sistema.astilleros = 1;
        sistema.fortalezas = 0;
        sistema.flotas = options.flotasRestantes ?? 8;
        sistema.recursos = {
        minerales: sistema.produccion?.minerales || 0,
        energia: sistema.produccion?.energia || 0,
        cristales: sistema.produccion?.cristales || 0,
        };
    }

    jugador.sistemas.add(sistemaId);
    jugador.sistemasControlados = jugador.sistemas.size;

    return { conquistado: true, sistema };
    }

    _evaluarVictoria() {
    if (this.ganador) return;

    const jugadoresActivos = Array.from(this.jugadores.values()).filter((jugador) => !jugador.eliminado);
    const sistemasTotales = this.sistemas.size || 1;

    const ganadorPorcentaje = jugadoresActivos.find((jugador) => {
        const control = jugador.sistemas.size / sistemasTotales;
        return control >= this.porcentajeVictoria;
    });

    if (ganadorPorcentaje) {
        this.ganador = ganadorPorcentaje.nickname;
        this._finalizarPartida("porcentaje");
        return;
    }

    if (jugadoresActivos.length === 1) {
        this.ganador = jugadoresActivos[0].nickname;
        this._finalizarPartida("ultimo_jugador");
    }
    }

    _finalizarPartida(motivo) {
    this.estado = "finalizada";
    this.detener();

    const ranking = Array.from(this.jugadores.values())
        .map((jugador) => ({
        socketId: jugador.socketId,
        nickname: jugador.nickname,
        puntaje: this._calcularPuntaje(jugador),
        sistemasConquistados: jugador.sistemas.size,
        recursos: jugador.recursos,
        flotasEnPie: this._calcularFlotasJugador(jugador.socketId),
        minasEnPie: this._contarEstructurasJugador(jugador.socketId, "minas"),
        centrosEnPie: this._contarEstructurasJugador(jugador.socketId, "centrales"),
        fortalezasEnPie: this._contarEstructurasJugador(jugador.socketId, "fortalezas"),
        }))
        .sort((a, b) => b.puntaje - a.puntaje)
        .map((jugador, index) => ({ ...jugador, posicion: index + 1 }));

    if (global.io && this.partida?.id) {
        global.io.to(this.partida.id).emit("game_over", {
        motivo,
        ganador: this.ganador,
        ranking,
        eventos: this.eventos,
        });
    }
    }

    _calcularFlotasJugador(socketId) {
    return Array.from(this.sistemas.values())
        .filter((sistema) => sistema.propietarioId === socketId)
        .reduce((total, sistema) => total + (sistema.flotas || 0), 0);
    }

    _contarEstructurasJugador(socketId, campo) {
    return Array.from(this.sistemas.values())
        .filter((sistema) => sistema.propietarioId === socketId)
        .reduce((total, sistema) => total + (sistema[campo] || 0), 0);
    }

    _calcularPuntaje(jugador) {
    const sistemasConquistados = jugador.sistemas.size * 5000;
    const totalRecursos = jugador.recursos.minerales * 1 + jugador.recursos.energia * 2 + jugador.recursos.cristales * 3;
    const estructuras = Array.from(this.sistemas.values())
        .filter((sistema) => sistema.propietarioId === jugador.socketId)
      .reduce((total, sistema) => total + (sistema.fortalezas || 0) * 100 + (sistema.centrales || 0) * 150, 0);

    return sistemasConquistados + totalRecursos + estructuras;
    }

  // ======================================================
  // NOMBRE: obtenerEstadoPartida
  // ENTRADA: sin entrada explícita (usa estado interno)
  // SALIDA: snapshot serializable para frontend
  // RESTRICCIONES: incluir solo datos necesarios de gameplay
  // OBJETIVO: sincronizar clientes en tiempo real
  // ======================================================
    obtenerEstadoPartida() {
    const sistemas = Array.from(this.sistemas.values()).map((sistema) => ({
        ...sistema,
        controladoPor: sistema.propietario,
    }));

    const jugadores = Array.from(this.jugadores.values()).map((jugador) => ({
        socketId: jugador.socketId,
        nickname: jugador.nickname,
        sistemaInicialId: jugador.sistemaInicialId,
        recursos: jugador.recursos,
        sistemasControlados: jugador.sistemas.size,
        sistemas: Array.from(jugador.sistemas),
        flotasEnPie: this._calcularFlotasJugador(jugador.socketId),
        puntaje: this._calcularPuntaje(jugador),
        eliminado: jugador.eliminado,
    }));

    return {
        id: this.partida.id,
        nombre: this.partida.nombre,
        galaxia: {
        nombre: this.partida.galaxia?.nombre,
        sistemas,
        rutas: this.partida.galaxia?.rutas || [],
        },
        tiempoProduccionRestante: this.tiempoProduccionRestante,
        intervaloProduccionMs: this.intervaloProduccionMs,
        inicioHabilitado: this.inicioHabilitado,
        inicioEnProceso: this.inicioEnProceso,
        jugadores,
        eventos: this.eventos,
        ganador: this.ganador,
        estado: this.estado,
    };
    }

    detener() {
    if (this.intervaloTimer) clearInterval(this.intervaloTimer);
    if (this.intervaloCuentaRegresivaInicio) clearInterval(this.intervaloCuentaRegresivaInicio);
    this.intervaloTimer = null;
    this.intervaloCuentaRegresivaInicio = null;
    }
}

module.exports = LogicaJuego;
