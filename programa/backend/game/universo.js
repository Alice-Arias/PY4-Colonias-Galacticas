// ==============================================================================================
// NOMBRE: universo.js
// ENTRADA: catálogo de galaxias y reglas de tiempo de partida
// SALIDA: clases y funciones para construir y consultar partidas
// RESTRICCIONES: mantener sincronía entre lobby, juego y producción
// OBJETIVO: modelar las galaxias, los sistemas y los tiempos de la partida
// ==============================================================================================
const catalogoGalaxias = require("../src/data/galaxia.json");

const produccionBase = {
  minero: { minerales: 100, energia: 30, cristales: 10 },
  energetico: { minerales: 50, energia: 50, cristales: 10 },
  cientifico: { minerales: 40, energia: 40, cristales: 30 },
  balanceado: { minerales: 35, energia: 35, cristales: 35 },
};

const coordenadasBase = [
  { x: 120, y: 90 },
  { x: 260, y: 90 },
  { x: 400, y: 90 },
  { x: 540, y: 90 },
  { x: 680, y: 90 },
  { x: 120, y: 190 },
  { x: 260, y: 190 },
  { x: 400, y: 190 },
  { x: 540, y: 190 },
  { x: 680, y: 190 },
  { x: 120, y: 290 },
  { x: 260, y: 290 },
  { x: 400, y: 290 },
  { x: 540, y: 290 },
  { x: 680, y: 290 },
  { x: 120, y: 390 },
  { x: 260, y: 390 },
  { x: 400, y: 390 },
  { x: 540, y: 390 },
  { x: 680, y: 390 },
  { x: 120, y: 470 },
  { x: 260, y: 470 },
  { x: 400, y: 470 },
  { x: 540, y: 470 },
  { x: 680, y: 470 },
];

// ==============================================================================================
// NOMBRE: Sistema
// ENTRADA: datos base de un sistema galáctico
// SALIDA: instancia con estado, producción y recursos del sistema
// RESTRICCIONES: requiere id, nombre y tipo válidos
// OBJETIVO: representar un planeta/sistema jugable
// ==============================================================================================
class Sistema {
  // ==============================================================================================
  // NOMBRE: constructor
  // ENTRADA: objeto datos del sistema
  // SALIDA: inicializa propiedades de estado y producción
  // RESTRICCIONES: datos.tipo debe existir en la tabla de producción o usar balanceado
  // OBJETIVO: construir un sistema listo para la partida
  // ==============================================================================================
  constructor(datos) {
    this.id = datos.id;
    this.nombre = datos.nombre;
    this.tipo = datos.tipo;
    this.x = datos.x;
    this.y = datos.y;
    this.estado = "neutral";
    this.propietario = null;
    this.defensa = Math.floor(Math.random() * 100);
    this.recursos = {
                      minerales: 0,
                      energia: 0,
                      cristales: 0,
    };
    this.produccion = produccionBase[this.tipo] || produccionBase.balanceado;
  }

  // ==============================================================================================
  // NOMBRE: producir
  // ENTRADA: sin entrada explícita
  // SALIDA: incrementa recursos del sistema según su producción
  // RESTRICCIONES: usa this.produccion como fuente de valores
  // OBJETIVO: aplicar un ciclo de producción local del sistema
  // ==============================================================================================
  producir() {
    const produccion = this.produccion;

    this.recursos.minerales += produccion.minerales;
    this.recursos.energia += produccion.energia;
    this.recursos.cristales += produccion.cristales;
  }
}

// ==============================================================================================
// NOMBRE: Galaxia
// ENTRADA: datos de galaxia con sistemas y rutas
// SALIDA: instancia con sistemas materializados y conectividad
// RESTRICCIONES: datos.sistemas y datos.rutas deben ser arreglos
// OBJETIVO: representar el mapa completo de juego
// ==============================================================================================
class Galaxia {
  // ==============================================================================================
  // NOMBRE: constructor
  // ENTRADA: objeto datos de galaxia
  // SALIDA: inicializa nombre, sistemas y rutas
  // RESTRICCIONES: asigna coordenadas por índice de catálogo
  // OBJETIVO: construir una galaxia utilizable en partida
  // ==============================================================================================
  constructor(datos) {
    this.nombre = datos.nombre;
    this.sistemas = datos.sistemas.map((sistema, indice) => {
      const coordenadas = coordenadasBase[indice] || { x: 0, y: 0 };
      return new Sistema({ ...sistema, ...coordenadas });
    });
    this.rutas = datos.rutas.map((ruta) => [...ruta]);
  }

  // ==============================================================================================
  // NOMBRE: desdeNombre
  // ENTRADA: nombre de galaxia
  // SALIDA: instancia Galaxia o null si no existe
  // RESTRICCIONES: busca en el catálogo local de galaxias
  // OBJETIVO: crear una galaxia a partir de su identificador de catálogo
  // ==============================================================================================
  static desdeNombre(nombre) {
    const galaxia = catalogoGalaxias.galaxias.find((item) => item.nombre === nombre);

    if (!galaxia) {
      return null;
    }

    return new Galaxia(galaxia);
  }

  // ==============================================================================================
  // NOMBRE: producir
  // ENTRADA: sin entrada explícita
  // SALIDA: ejecuta producción en todos los sistemas
  // RESTRICCIONES: delega en Sistema.producir de cada nodo
  // OBJETIVO: aplicar el ciclo global de recursos de la galaxia
  // ==============================================================================================
  producir() {
    this.sistemas.forEach((sistema) => sistema.producir());
  }
}

// ==============================================================================================
// NOMBRE: Universo
// ENTRADA: catálogo completo de galaxias
// SALIDA: API para listar y crear galaxias
// RESTRICCIONES: catálogo cargado desde archivo de datos
// OBJETIVO: actuar como fábrica principal de galaxias
// ==============================================================================================
class Universo {
  // ==============================================================================================
  // NOMBRE: constructor
  // ENTRADA: sin entrada explícita
  // SALIDA: inicializa acceso al catálogo de galaxias
  // RESTRICCIONES: depende de catalogoGalaxias.galaxias
  // OBJETIVO: preparar el servicio de universo para consultas
  // ==============================================================================================
  constructor() {
    this.catalogo = catalogoGalaxias.galaxias;
  }

  // ==============================================================================================
  // NOMBRE: listarGalaxias
  // ENTRADA: sin entrada explícita
  // SALIDA: lista resumida de galaxias disponibles
  // RESTRICCIONES: solo retorna nombre y cantidad de sistemas
  // OBJETIVO: exponer opciones válidas para crear partida
  // ==============================================================================================
  listarGalaxias() {
    return this.catalogo.map((galaxia) => ({
      nombre: galaxia.nombre,
      sistemas: galaxia.sistemas.length,
    }));
  }

  // ==============================================================================================
  // NOMBRE: crearGalaxia
  // ENTRADA: nombre de galaxia solicitada
  // SALIDA: instancia Galaxia válida
  // RESTRICCIONES: si no existe nombre solicitado usa la primera galaxia disponible
  // OBJETIVO: entregar un mapa jugable para una partida
  // ==============================================================================================
  crearGalaxia(nombre) {
    const galaxia = Galaxia.desdeNombre(nombre) || Galaxia.desdeNombre(this.catalogo[0]?.nombre);

    if (!galaxia) {
      throw new Error("No hay galaxias disponibles");
    }

    return galaxia;
  }
}

const universo = new Universo();

// ==============================================================================================
// NOMBRE: Partida
// ENTRADA: configuración de sala, tiempos, host y galaxia
// SALIDA: entidad de partida con estado de lobby y juego
// RESTRICCIONES: tiempos en segundos y galaxia válida
// OBJETIVO: encapsular el ciclo de vida completo de una partida
// ==============================================================================================
class Partida {
  // ==============================================================================================
  // NOMBRE: constructor
  // ENTRADA: objeto de configuración inicial de partida
  // SALIDA: inicializa atributos de lobby, tiempos y recursos
  // RESTRICCIONES: normaliza recursos y tiempos mínimos
  // OBJETIVO: crear una partida lista para recibir jugadores
  // ==============================================================================================
  constructor({ id, nombre, maxJugadores, host, galaxia, tiempoEspera = 300, tiempoMax = 1800, tematica = "clasica", recursosIniciales = null }) {
    this.id = id;
    this.nombre = nombre;
    this.maxJugadores = maxJugadores;
    this.estado = "esperando";
    this.host = host;
    this.jugadores = [];
    this.galaxia = galaxia;
    this.tematica = tematica;
    this.intervaloProduccion = null;
    this.tiempoEspera = tiempoEspera;
    this.tiempoCreacion = Date.now();
    this.tiempoExpiracion = Date.now() + tiempoEspera * 1000;
    this.tiempoMax = tiempoMax;
    this.tiempoInicioJuego = null;
    this.tiempoFinJuego = null;
    this.recursosIniciales = {
      minerales: Number(recursosIniciales?.minerales) || 300,
      energia: Number(recursosIniciales?.energia) || 150,
      cristales: Number(recursosIniciales?.cristales) || 50,
    };
  }

  // ==============================================================================================
  // NOMBRE: obtenerTiempoRestante
  // ENTRADA: sin entrada explícita
  // SALIDA: segundos restantes de espera en lobby
  // RESTRICCIONES: nunca retorna valores negativos
  // OBJETIVO: informar el tiempo de expiración de la sala
  // ==============================================================================================
  obtenerTiempoRestante() {
    const ahora = Date.now();
    const tiempoRestante = Math.max(0, Math.floor((this.tiempoExpiracion - ahora) / 1000));
    return tiempoRestante;
  }

  // ==============================================================================================
  // NOMBRE: estaExpirada
  // ENTRADA: sin entrada explícita
  // SALIDA: true si el lobby ya expiró
  // RESTRICCIONES: depende de obtenerTiempoRestante
  // OBJETIVO: decidir eliminación automática de sala
  // ==============================================================================================
  estaExpirada() {
    return this.obtenerTiempoRestante() <= 0;
  }

  // ==============================================================================================
  // NOMBRE: agregarJugador
  // ENTRADA: objeto jugador
  // SALIDA: agrega jugador si no existe previamente
  // RESTRICCIONES: unicidad por id de jugador
  // OBJETIVO: registrar participantes de la partida
  // ==============================================================================================
  agregarJugador(jugador) {
    const existe = this.jugadores.some((actual) => actual.id === jugador.id);

    if (!existe) {
      this.jugadores.push(jugador);
    }
  }

  // ==============================================================================================
  // NOMBRE: puedeIniciar
  // ENTRADA: socketId de quien solicita iniciar
  // SALIDA: true si es host y la sala está completa
  // RESTRICCIONES: compara contra host y maxJugadores
  // OBJETIVO: validar permiso de inicio de partida
  // ==============================================================================================
  puedeIniciar(socketId) {
    return this.host === socketId && this.jugadores.length >= this.maxJugadores;
  }

  // ==============================================================================================
  // NOMBRE: marcarInicioJuego
  // ENTRADA: sin entrada explícita
  // SALIDA: fija timestamps de inicio y fin de juego
  // RESTRICCIONES: tiempoMax mínimo de 1 segundo
  // OBJETIVO: activar cronómetro oficial de partida
  // ==============================================================================================
  marcarInicioJuego() {
    this.tiempoInicioJuego = Date.now();
    this.tiempoFinJuego = this.tiempoInicioJuego + Math.max(1, this.tiempoMax || 0) * 1000;
  }

  // ==============================================================================================
  // NOMBRE: obtenerTiempoJuegoRestante
  // ENTRADA: sin entrada explícita
  // SALIDA: segundos restantes de la partida activa
  // RESTRICCIONES: nunca retorna valores negativos
  // OBJETIVO: alimentar temporizador del juego en curso
  // ==============================================================================================
  obtenerTiempoJuegoRestante() {
    if (!this.tiempoFinJuego) return Math.max(0, Math.floor(this.tiempoMax || 0));
    return Math.max(0, Math.floor((this.tiempoFinJuego - Date.now()) / 1000));
  }

  // ==============================================================================================
  // NOMBRE: estaFinalizadaPorTiempo
  // ENTRADA: sin entrada explícita
  // SALIDA: true si el tiempo de juego llegó a cero
  // RESTRICCIONES: requiere tiempoFinJuego definido
  // OBJETIVO: determinar fin automático por duración
  // ==============================================================================================
  estaFinalizadaPorTiempo() {
    return Boolean(this.tiempoFinJuego) && this.obtenerTiempoJuegoRestante() <= 0;
  }

  // ==============================================================================================
  // NOMBRE: iniciarProduccion
  // ENTRADA: intervalo en milisegundos
  // SALIDA: inicia/renueva intervalo de producción de galaxia
  // RESTRICCIONES: reemplaza intervalo anterior si existe
  // OBJETIVO: emitir ciclos periódicos de producción y actualización
  // ==============================================================================================
  iniciarProduccion(intervalo = 20000) {
    if (this.intervaloProduccion) {
      clearInterval(this.intervaloProduccion);
    }

    this.intervaloProduccion = setInterval(() => {
      if (!this.galaxia) {
        return;
      }

      this.galaxia.producir();

      if (global.io) {
        global.io.to(this.id).emit("galaxia_update", this.galaxia);
      }
    }, intervalo);
  }
}

// ==============================================================================================
// NOMBRE: crearUniverso
// ENTRADA: nombre de galaxia
// SALIDA: instancia de galaxia para nueva partida
// RESTRICCIONES: delega en universo.crearGalaxia
// OBJETIVO: exponer fábrica simple de galaxias
// ==============================================================================================
function crearUniverso(nombreGalaxia) {
  return universo.crearGalaxia(nombreGalaxia);
}

// ==============================================================================================
// NOMBRE: listarGalaxias
// ENTRADA: sin entrada explícita
// SALIDA: listado de galaxias disponibles
// RESTRICCIONES: delega en universo.listarGalaxias
// OBJETIVO: exponer catálogo para UI y API
// ==============================================================================================
function listarGalaxias() {
  return universo.listarGalaxias();
}

module.exports = {
  Partida,
  Universo,
  universo,
  crearUniverso,
  listarGalaxias,
};