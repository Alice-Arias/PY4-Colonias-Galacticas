// ==============================================================================================
// NOMBRE: flotas.js
// ENTRADA: cantidad de flotas a enviar
// SALIDA: coste de movimiento y validaciones asociadas
// RESTRICCIONES: mantener coherencia con el backend de combate y movimiento
// OBJETIVO: calcular costes y reglas de envío de flotas
// ==============================================================================================
const COSTO_ENVIO_POR_FLOTA = {
    minerales: 3,
    energia: 5,
    cristales: 1,
};

// ==============================================================================================
// NOMBRE: calcularCostoMovimiento
// ENTRADA: cantidad de flotas
// SALIDA: coste total de envío
// RESTRICCIONES: cantidad se normaliza a número no negativo
// OBJETIVO: calcular el gasto de mover flotas
// ==============================================================================================
export function calcularCostoMovimiento(cantidad) {
    const cant = Math.max(0, Number(cantidad) || 0);
    return {
        minerales: COSTO_ENVIO_POR_FLOTA.minerales * cant,
        energia:   COSTO_ENVIO_POR_FLOTA.energia   * cant,
        cristales: COSTO_ENVIO_POR_FLOTA.cristales * cant,
    };
}