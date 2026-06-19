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

class Sistema {
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

  producir() {
    const produccion = this.produccion;

    this.recursos.minerales += produccion.minerales;
    this.recursos.energia += produccion.energia;
    this.recursos.cristales += produccion.cristales;
  }
}

class Galaxia {
  constructor(datos) {
    this.nombre = datos.nombre;
    this.sistemas = datos.sistemas.map((sistema, indice) => {
      const coordenadas = coordenadasBase[indice] || { x: 0, y: 0 };
      return new Sistema({ ...sistema, ...coordenadas });
    });
    this.rutas = datos.rutas.map((ruta) => [...ruta]);
  }

  static desdeNombre(nombre) {
    const galaxia = catalogoGalaxias.galaxias.find((item) => item.nombre === nombre);

    if (!galaxia) {
      return null;
    }

    return new Galaxia(galaxia);
  }

  producir() {
    this.sistemas.forEach((sistema) => sistema.producir());
  }
}

class Universo {
  constructor() {
    this.catalogo = catalogoGalaxias.galaxias;
  }

  listarGalaxias() {
    return this.catalogo.map((galaxia) => ({
      nombre: galaxia.nombre,
      sistemas: galaxia.sistemas.length,
    }));
  }

  crearGalaxia(nombre) {
    const galaxia = Galaxia.desdeNombre(nombre) || Galaxia.desdeNombre(this.catalogo[0]?.nombre);

    if (!galaxia) {
      throw new Error("No hay galaxias disponibles");
    }

    return galaxia;
  }
}

const universo = new Universo();

class Partida {
  constructor({ id, nombre, maxJugadores, host, galaxia, tiempoEspera = 300, tiempoMax = 300, tematica = "clasica", recursosIniciales = null }) {
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

  obtenerTiempoRestante() {
    const ahora = Date.now();
    const tiempoRestante = Math.max(0, Math.floor((this.tiempoExpiracion - ahora) / 1000));
    return tiempoRestante;
  }

  estaExpirada() {
    return this.obtenerTiempoRestante() <= 0;
  }

  agregarJugador(jugador) {
    const existe = this.jugadores.some((actual) => actual.id === jugador.id);

    if (!existe) {
      this.jugadores.push(jugador);
    }
  }

  puedeIniciar(socketId) {
    return this.host === socketId && this.jugadores.length >= this.maxJugadores;
  }

  marcarInicioJuego() {
    this.tiempoInicioJuego = Date.now();
    this.tiempoFinJuego = this.tiempoInicioJuego + Math.max(1, this.tiempoMax || 0) * 1000;
  }

  obtenerTiempoJuegoRestante() {
    if (!this.tiempoFinJuego) return Math.max(0, Math.floor(this.tiempoMax || 0));
    return Math.max(0, Math.floor((this.tiempoFinJuego - Date.now()) / 1000));
  }

  estaFinalizadaPorTiempo() {
    return Boolean(this.tiempoFinJuego) && this.obtenerTiempoJuegoRestante() <= 0;
  }

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

function crearUniverso(nombreGalaxia) {
  return universo.crearGalaxia(nombreGalaxia);
}

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