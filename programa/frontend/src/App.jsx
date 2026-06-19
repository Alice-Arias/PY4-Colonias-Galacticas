import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import CrearPartida from "./pages/CrearPartida";
import UnirsePartida from "./pages/UnirsePartida";
import Ranking from "./pages/Ranking";
import ResumenPartida from "./pages/ResumenPartida";
import Juego from "./pages/Juego";
import JuegoDebug from "./pages/JuegoDebug";
import Lobby from "./pages/Lobby";
import "./styles/Temas.css";

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
      <Route path="/juego-debug" element={<JuegoDebug />} />
      <Route path="/lobby" element={<Lobby />} />
    </Routes>
  );
}

export default App;