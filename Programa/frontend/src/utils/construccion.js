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

export function puedeConstruir(tipoEdificio, recursos) {
    const costo = COSTOS_CONSTRUCCION[tipoEdificio];
    if (!costo || !recursos) return false;
    return (
        recursos.minerales >= costo.minerales &&
        recursos.energia   >= costo.energia   &&
        recursos.cristales >= costo.cristales
    );
}

export function getCostoConstruccion(tipoEdificio) {
    return COSTOS_CONSTRUCCION[tipoEdificio] || { minerales: 0, energia: 0, cristales: 0 };
}

export function getCostosTexto() {
    return { ...COSTOS_TEXTO };
}