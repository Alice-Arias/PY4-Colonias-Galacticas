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

export function normalizarTematica(valor) {
    return TEMATICAS[valor] ? valor : "clasica";
}

export function obtenerInfoTematica(valor) {
    return TEMATICAS[normalizarTematica(valor)] || TEMATICAS.clasica;
}
