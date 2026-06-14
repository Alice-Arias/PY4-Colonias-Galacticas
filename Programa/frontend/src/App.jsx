import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import CrearPartida from "./pages/CrearPartida";
import UnirsePartida from "./pages/UnirsePartida";
import Ranking from "./pages/Ranking";
import Juego from "./pages/Juego";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/crear" element={<CrearPartida />} />
      <Route path="/unirse" element={<UnirsePartida />} />
      <Route path="/ranking" element={<Ranking />} />
      <Route path="/juego" element={<Juego />} />
    </Routes>
  );
}

export default App;