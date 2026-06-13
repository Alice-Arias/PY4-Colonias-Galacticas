const express = require("express");

console.log("galaxiaRoutes cargado");

const router = express.Router();

const CargadorGalaxia =
    require("../services/CargadorGalaxia");

router.get("/", (req, res) => {
    try {

        console.log("Entró a /api/galaxia");

        const universo = CargadorGalaxia.cargar();

        res.json({
            sistemas: Array.from(
                universo.sistemas.values()
            ),
            rutas: Array.from(
                universo.adyacencias.entries()
            )
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }
});

module.exports = router;