// ======================================================
// NOMBRE: combate
// ENTRADA: datos de defensas y combate real
// SALIDA: utilidades ligadas exclusivamente al combate
// OBJETIVO: mantener separado el combate de la construcción y la movilidad
// ======================================================

// ======================================================
// NOMBRE: calcularDefensaEstimada
// ENTRADA: sistema destino con flotas, minas y fortalezas
// SALIDA: número con la defensa total estimada del sistema
// RESTRICCIONES: sistema debe existir, valores por defecto en 0
// OBJETIVO: mostrar al jugador una estimación del combate antes de una batalla
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