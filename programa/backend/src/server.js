const express = require("express");
const cors = require("cors");

const app = express();

const galaxiaRoutes = require("./routes/galaxiaRoutes");

app.use(cors());
app.use(express.json());

app.use("/api/galaxia", galaxiaRoutes);

app.listen(3000, () => {
    console.log("Servidor iniciado en puerto 3000");
});