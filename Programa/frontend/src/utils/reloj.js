// Utilidad de tiempo monotónico para animaciones y sincronización local.
// ==============================================================================================
// NOMBRE: ahoraMonotonoMs
// ENTRADA: sin entrada explícita
// SALIDA: timestamp monotónico en milisegundos
// RESTRICCIONES: depende de performance.now
// OBJETIVO: evitar drift en animaciones y cronómetros locales
// ==============================================================================================
export function ahoraMonotonoMs() {
    return performance.now();
}
