import { useNavigate } from "react-router-dom";
import { useState } from "react";

// ======================================================
// NOMBRE: Login (Ingreso del jugador)
// ENTRADA: nickname escrito por el usuario
// SALIDA: almacenamiento en localStorage + redirección a Home
// RESTRICCIONES:
// - nickname obligatorio
// - mínimo 4 caracteres
// - máximo 20 caracteres
// - requiere React Router configurado
// OBJETIVO:
// Registrar al jugador localmente antes de entrar al juego
// ======================================================
export default function Login() {
  const [nickname, setNickname] = useState("");
  const navigate = useNavigate();

  // ======================================================
  // NOMBRE: entrar al juego
  // ENTRADA: nickname del input
  // SALIDA: guarda nickname y navega a /home
  // RESTRICCIONES:
  // - no permite strings vacíos
  // - valida longitud mínima y máxima
  // OBJETIVO:
  // Asegurar identidad básica del jugador antes de jugar
  // ======================================================
  const entrar = () => {
    const limpio = nickname.trim();

    if (!limpio) {
      alert("Ingrese un nickname");
      return;
    }

    if (limpio.length < 4) {
      alert("El nickname debe tener al menos 4 caracteres");
      return;
    }

    if (limpio.length > 20) {
      alert("El nickname no puede tener más de 20 caracteres");
      return;
    }

    localStorage.setItem("nickname", limpio);
    navigate("/home");
  };

  return (
    <div>
      {/* ======================================================
          TÍTULO DEL JUEGO
      ====================================================== */}
      <h1>Colonias Galácticas</h1>

      {/* ======================================================
          INPUT DE NICKNAME
      ====================================================== */}
      <input
        type="text"
        placeholder="Nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />

      {/* ======================================================
          BOTÓN DE ENTRADA
      ====================================================== */}
      <button onClick={entrar}>
        Entrar
      </button>
    </div>
  );
}