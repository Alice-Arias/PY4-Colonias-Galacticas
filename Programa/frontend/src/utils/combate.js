// ======================================================
// NOMBRE: combate
// ENTRADA: datos de sistemas, flotas y recursos del jugador
// SALIDA: estimaciones de combate y costos para mostrar en UI
// OBJETIVO: centralizar cálculos de combate visibles en el frontend
// ======================================================

const COSTO_ENVIO_POR_FLOTA = {
    minerales: 3,
    energia: 5,
    cristales: 1,
};

const COSTOS_CONSTRUCCION = {
    mina:      { minerales: 100, energia: 0,   cristales: 0   },
    central:   { minerales: 80,  energia: 50,  cristales: 200 },
    astillero: { minerales: 150, energia: 100, cristales: 10  },
    fortaleza: { minerales: 200, energia: 100, cristales: 30  },
};

const COSTOS_TEXTO = {
    mina:      "100 minerales",
    central:   "80 minerales + 50 energía + 200 cristales",
    astillero: "150 minerales + 100 energía + 10 cristales",
    fortaleza: "200 minerales + 100 energía + 30 cristales",
};

// ======================================================
// NOMBRE: calcularDefensaEstimada
// ENTRADA: sistema destino con flotas, minas y fortalezas
// SALIDA: número con la defensa total estimada del sistema
// RESTRICCIONES: sistema debe existir, valores por defecto en 0
// OBJETIVO: mostrar al jugador la defensa del sistema antes de atacar
// ======================================================
export function calcularDefensaEstimada(sistemaDestino) {
    if (!sistemaDestino) return 0;
    return (
        (sistemaDestino.flotas     || 0) +
        (sistemaDestino.minas      || 0) * 3 +
        (sistemaDestino.fortalezas || 0) * 2
    );
}

// ======================================================
// NOMBRE: calcularCostoMovimiento
// ENTRADA: cantidad de flotas a enviar
// SALIDA: objeto con costo en minerales, energía y cristales
// RESTRICCIONES: cantidad debe ser mayor a 0
// OBJETIVO: mostrar el costo de mover flotas antes de confirmar
// ======================================================
export function calcularCostoMovimiento(cantidad) {
    const cant = Math.max(0, Number(cantidad) || 0);
    return {
        minerales: COSTO_ENVIO_POR_FLOTA.minerales * cant,
        energia:   COSTO_ENVIO_POR_FLOTA.energia   * cant,
        cristales: COSTO_ENVIO_POR_FLOTA.cristales * cant,
    };
}

// ======================================================
// NOMBRE: calcularBalanceCombate
// ENTRADA: cantidad de flotas atacantes y defensa estimada del destino
// SALIDA: número positivo si el atacante gana, negativo si pierde
// RESTRICCIONES: ninguna
// OBJETIVO: indicar visualmente si el ataque tiene ventaja o riesgo
// ======================================================
export function calcularBalanceCombate(flotasAtaque, defensaEstimada) {
    return flotasAtaque - defensaEstimada;
}

// ======================================================
// NOMBRE: esCombateDirecto
// ENTRADA: sistema origen y sistema destino
// SALIDA: booleano indicando si el envío resulta en combate
// RESTRICCIONES: ambos sistemas deben existir
// OBJETIVO: determinar si el envío de flotas implica un ataque
// ======================================================
export function esCombateDirecto(sistemaOrigen, sistemaDestino) {
    if (!sistemaOrigen || !sistemaDestino) return false;
    return Boolean(
        sistemaDestino.propietarioId &&
        sistemaDestino.propietarioId !== sistemaOrigen.propietarioId
    );
}

// ======================================================
// NOMBRE: puedeConstruir
// ENTRADA: tipo de edificio y recursos actuales del jugador
// SALIDA: booleano indicando si tiene recursos suficientes
// RESTRICCIONES: tipo debe ser uno de los definidos en COSTOS_CONSTRUCCION
// OBJETIVO: habilitar o deshabilitar el botón de construcción en la UI
// ======================================================
export function puedeConstruir(tipoEdificio, recursos) {
    const costo = COSTOS_CONSTRUCCION[tipoEdificio];
    if (!costo || !recursos) return false;
    return (
        recursos.minerales >= costo.minerales &&
        recursos.energia   >= costo.energia   &&
        recursos.cristales >= costo.cristales
    );
}

// ======================================================
// NOMBRE: getCostoConstruccion
// ENTRADA: tipo de edificio
// SALIDA: objeto con costo en minerales, energía y cristales
// RESTRICCIONES: tipo debe ser uno de los definidos
// OBJETIVO: obtener el costo de construcción para mostrarlo en el modal
// ======================================================
export function getCostoConstruccion(tipoEdificio) {
    return COSTOS_CONSTRUCCION[tipoEdificio] || { minerales: 0, energia: 0, cristales: 0 };
}

// ======================================================
// NOMBRE: getCostosTexto
// ENTRADA: ninguna
// SALIDA: objeto con costos en formato de texto legible
// RESTRICCIONES: ninguna
// OBJETIVO: exponer los costos en texto para mostrar en la lista de construcción
// ======================================================
export function getCostosTexto() {
    return { ...COSTOS_TEXTO };
}