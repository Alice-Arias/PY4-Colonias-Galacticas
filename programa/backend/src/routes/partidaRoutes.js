const express = require("express");
const router = express.Router();

router.post("/", (Req,res) => {
    res.json({
        mensaje: "Partida creada"
    });
});

module.exports = router;