// ==============================================================================================
// NOMBRE: tematicas.js
// ENTRADA: catálogo de temas visuales
// SALIDA: opciones de estilo y bonificación estética
// RESTRICCIONES: mantener nombres y clases compatibles con la UI
// OBJETIVO: definir las temáticas visuales disponibles
// ==============================================================================================
export const TEMATICAS = {
    clasica: { label: "Clásica", bonusPts: 0, className: "theme-clasica" },
    aurora: { label: "Aurora", bonusPts: 4, className: "theme-aurora" },
    imperial: { label: "Imperial", bonusPts: 4, className: "theme-imperial" },
    abisal: { label: "Abisal", bonusPts: 4, className: "theme-abisal" },
};

export const TEMATICA_OPTIONS = Object.entries(TEMATICAS).map(([value, data]) => ({
    value,
    label: data.label,
    bonusPts: data.bonusPts,
}));

// ==============================================================================================
// NOMBRE: normalizarTematica
// ENTRADA: valor de temática
// SALIDA: temática válida o fallback
// RESTRICCIONES: se limita al catálogo TEMATICAS
// OBJETIVO: asegurar tema coherente en UI
// ==============================================================================================
export function normalizarTematica(valor) {
    return TEMATICAS[valor] ? valor : "clasica";
}

// ==============================================================================================
// NOMBRE: obtenerInfoTematica
// ENTRADA: valor de temática
// SALIDA: objeto descriptivo del tema
// RESTRICCIONES: aplica normalización previa del valor
// OBJETIVO: obtener metadatos de visualización por temática
// ==============================================================================================
export function obtenerInfoTematica(valor) {
    return TEMATICAS[normalizarTematica(valor)] || TEMATICAS.clasica;
}
