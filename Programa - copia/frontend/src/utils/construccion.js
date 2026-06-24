// ==============================================================================================
// NOMBRE: construccion.js
// ENTRADA: tipo de edificio y recursos disponibles
// SALIDA: costes y validaciones de construcción
// RESTRICCIONES: mantener las reglas de coste sincronizadas con el backend
// OBJETIVO: calcular costes y validaciones de construcción
// ==============================================================================================
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

// ==============================================================================================
// NOMBRE: puedeConstruir
// ENTRADA: tipo de edificio y recursos del jugador
// SALIDA: true/false según capacidad de construcción
// RESTRICCIONES: tipo debe existir en COSTOS_CONSTRUCCION
// OBJETIVO: validar si una construcción es posible
// ==============================================================================================
export function puedeConstruir(tipoEdificio, recursos) {
    const costo = COSTOS_CONSTRUCCION[tipoEdificio];
    if (!costo || !recursos) return false;
    return (
        recursos.minerales >= costo.minerales &&
        recursos.energia   >= costo.energia   &&
        recursos.cristales >= costo.cristales
    );
}

// ==============================================================================================
// NOMBRE: getCostoConstruccion
// ENTRADA: tipo de edificio
// SALIDA: objeto de coste correspondiente
// RESTRICCIONES: retorna null si no existe tipo
// OBJETIVO: obtener el coste unitario de construcción
// ==============================================================================================
export function getCostoConstruccion(tipoEdificio) {
    return COSTOS_CONSTRUCCION[tipoEdificio] || { minerales: 0, energia: 0, cristales: 0 };
}

// ==============================================================================================
// NOMBRE: getCostosTexto
// ENTRADA: sin entrada explícita
// SALIDA: lista de costes en formato textual
// RESTRICCIONES: usa el catálogo fijo de costes
// OBJETIVO: alimentar etiquetas visibles de UI
// ==============================================================================================
export function getCostosTexto() {
    return { ...COSTOS_TEXTO };
}