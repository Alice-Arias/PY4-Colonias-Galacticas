const COSTO_ENVIO_POR_FLOTA = {
    minerales: 3,
    energia: 5,
    cristales: 1,
};

export function calcularCostoMovimiento(cantidad) {
    const cant = Math.max(0, Number(cantidad) || 0);
    return {
        minerales: COSTO_ENVIO_POR_FLOTA.minerales * cant,
        energia:   COSTO_ENVIO_POR_FLOTA.energia   * cant,
        cristales: COSTO_ENVIO_POR_FLOTA.cristales * cant,
    };
}