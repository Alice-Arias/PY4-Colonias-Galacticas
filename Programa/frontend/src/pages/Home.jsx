import { useNavigate } from "react-router-dom";

// ======================================================
// NOMBRE: Home (Pantalla principal del jugador)
// ENTRADA: nickname almacenado en localStorage
// SALIDA: navegación a crear, unirse o ranking
// RESTRICCIONES:
// - Debe existir un nickname guardado previamente
// - React Router debe estar configurado correctamente
// OBJETIVO:
// Servir como menú principal del juego multijugador
// ======================================================
export default function Home() {
  const navigate = useNavigate();
  const nickname = localStorage.getItem("nickname");

  return (
    <div>
      {/* ======================================================
          BIENVENIDA DEL USUARIO
          Muestra el nombre del jugador actual
      ====================================================== */}
      <h1>Bienvenido {nickname}</h1>

      {/* ======================================================
          BOTONES DE NAVEGACIÓN
          Dirigen a las diferentes partes del juego
      ====================================================== */}
      <button onClick={() => navigate("/crear")}>
        Crear
      </button>

      <button onClick={() => navigate("/unirse")}>
        Unirse
      </button>

      <button onClick={() => navigate("/ranking")}>
        Ranking
      </button>
    </div>
  );
}