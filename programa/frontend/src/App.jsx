// ==============================================================================================
// NOMBRE: App
// ENTRADA: rutas de navegación de la aplicación
// SALIDA: árbol principal de rutas React
// RESTRICCIONES: mantener las rutas sincronizadas con la experiencia del juego
// OBJETIVO: definir las rutas principales de la interfaz
// ==============================================================================================
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import CrearPartida from "./pages/CrearPartida";
import UnirsePartida from "./pages/UnirsePartida";
import Ranking from "./pages/Ranking";
import ResumenPartida from "./pages/ResumenPartida";
import Juego from "./pages/Juego";
import Lobby from "./pages/Lobby";
import "./styles/Temas.css";

// ==============================================================================================
// NOMBRE: App
// ENTRADA: sin entrada explícita
// SALIDA: definición de rutas principales
// RESTRICCIONES: depende de React Router
// OBJETIVO: componer la navegación global de la aplicación
// ==============================================================================================
function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/crear" element={<CrearPartida />} />
      <Route path="/unirse" element={<UnirsePartida />} />
      <Route path="/ranking" element={<Ranking />} />
      <Route path="/partida-final" element={<ResumenPartida />} />
      <Route path="/partida" element={<Juego />} />
      <Route path="/juego" element={<Navigate to="/partida" replace />} />
      <Route path="/lobby" element={<Lobby />} />
    </Routes>
  );
}

export default App;