// ======================================================
// NOMBRE: Jugador de una partida
// ENTRADA: datos del jugador y su estado en la partida
// SALIDA: objeto con recursos, sistemas, flotas, etc.
// OBJETIVO: Gestionar estado individual de cada jugador
// ======================================================

class JugadorPartida {
  constructor(socketId, nickname, sistemasIniciales) {
    this.socketId = socketId;
    this.nickname = nickname;
    
    // Recursos
    this.recursos = {
      minerales: sistemasIniciales.minerales || 300,
      energia: sistemasIniciales.energia || 150,
      cristales: sistemasIniciales.cristales || 50,
    };

    // Sistemas y edificios
    this.sistemas = new Map(); // sistemaId -> { minas, centrales, astilleros, fortalezas }
    this.flotas = new Map(); // "origen->destino" -> cantidad
    this.rutaEnAtaque = false;
    
    // Estadísticas
    this.puntaje = 0;
    this.sistemasControlados = 0;
    this.eliminado = false;
    
    // Inicializar sistema base
    if (sistemasIniciales.sistemaBase) {
      this.sistemas.set(sistemasIniciales.sistemaBase, {
        propietario: socketId,
        minas: 1,
        centrales: 1,
        astilleros: 0,
        fortalezas: 0,
      });
      this.sistemasControlados = 1;
    }
  }

  tieneSistema(sistemaId) {
    return this.sistemas.has(sistemaId);
  }

  obtenerSistemaBase() {
    return Array.from(this.sistemas.keys())[0] || null;
  }

  agregarRecursos(tipo, cantidad) {
    if (this.recursos[tipo] !== undefined) {
      this.recursos[tipo] += cantidad;
      return true;
    }
    return false;
  }

  gastarRecursos(minerales, energia, cristales) {
    if (
      this.recursos.minerales >= minerales &&
      this.recursos.energia >= energia &&
      this.recursos.cristales >= cristales
    ) {
      this.recursos.minerales -= minerales;
      this.recursos.energia -= energia;
      this.recursos.cristales -= cristales;
      return true;
    }
    return false;
  }

  obtenerTotalRecursos() {
    return (
      this.recursos.minerales * 1 +
      this.recursos.energia * 2 +
      this.recursos.cristales * 3
    );
  }

  obtenerPuntaje() {
    let puntaje = this.sistemasControlados * 5000;
    puntaje += this.obtenerTotalRecursos();
    
    // Sumar infraestructura
    for (const sistema of this.sistemas.values()) {
      puntaje += sistema.fortalezas * 100;
      puntaje += sistema.centrales * 150;
    }
    
    return puntaje;
  }
}

module.exports = JugadorPartida;
