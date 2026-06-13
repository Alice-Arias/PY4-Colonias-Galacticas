const galaxiaBase = require("../src/data/galaxia.json");

// ===================================================================
// NOMBRE: Tipos de producción de sistemas
// ENTRADA: tipo de sistema (minero, energético, científico, balanceado)
// SALIDA: objeto con cantidades de recursos producidos por ciclo
// RESTRICCIONES:
// - No modificar los valores base sin ajustar balance del juego
// - Cada tipo debe mantener estructura idéntica
// OBJETIVO:
// Definir la economía base del juego según el tipo de sistema
// ===================================================================
const produccionBase = {
  minero: { minerales: 100, energia: 30, cristales: 10 },
  energetico: { minerales: 50, energia: 50, cristales: 10 },
  cientifico: { minerales: 40, energia: 40, cristales: 30 },
  balanceado: { minerales: 35, energia: 35, cristales: 35 }
};

// ===================================================================
// NOMBRE: Crear universo
// ENTRADA: galaxiaBase (estructura JSON con sistemas)
// SALIDA: galaxia procesada lista para ser usada en el juego
// RESTRICCIONES:
// - No alterar estructura original de galaxiaBase
// - Mantener posición, id y datos base de cada sistema
// - defensa debe ser un número aleatorio entre 0 y 99
// - propietario debe iniciar en null
// OBJETIVO:
// Inicializar la galaxia con estados neutrales para inicio de partida
// ===================================================================
function crearUniverso() {
  const sistemasProcesados = galaxiaBase.sistemas.map((s) => ({
    ...s,

    estado: "neutral",

    propietario: null,

    defensa: Math.floor(Math.random() * 100),

    recursos: {
      minerales: 0,
      energia: 0,
      cristales: 0
    },

    produccion: produccionBase[s.tipo] || produccionBase.balanceado
  }));

  return {
    ...galaxiaBase,
    sistemas: sistemasProcesados
  };
}

// ===================================================================
// NOMBRE: Inicio de producción automática
// ENTRADA:
// - partida: objeto de la partida activa
// - intervalo: tiempo en milisegundos entre ciclos de producción
// SALIDA:
// - actualización constante de recursos en la galaxia
// - emisión de estado actualizado por socket global
// RESTRICCIONES:
// - Solo ejecuta si partida y galaxia existen
// - No debe reiniciar recursos existentes
// - No debe crear múltiples intervalos duplicados sin control externo
// - Requiere global.io para emitir eventos
// OBJETIVO:
// Simular producción en tiempo real dentro del universo del juego
// ===================================================================
function iniciarProduccion(partida, intervalo = 20000) {
  setInterval(() => {
    if (!partida?.galaxia) return;

    partida.galaxia.sistemas.forEach((s) => {
      const p = s.produccion;
      if (!p) return;

      s.recursos.minerales += p.minerales;
      s.recursos.energia += p.energia;
      s.recursos.cristales += p.cristales;
    });

    if (global.io) {
      global.io.to(partida.id).emit("galaxia_update", partida.galaxia);
    }

  }, intervalo);
}

// ===================================================================
// EXPORTACIÓN DEL MÓDULO
// ===================================================================
// Expone funciones principales del sistema de universo
module.exports = {
  crearUniverso,
  iniciarProduccion
};