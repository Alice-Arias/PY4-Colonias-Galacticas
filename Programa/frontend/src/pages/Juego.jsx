import { useEffect, useState } from "react";
import socket from "../services/socket";

// ======================================================
// NOMBRE: Juego (Estado en tiempo real de la partida)
// ENTRADA: socket, nickname del usuario, partidaId
// SALIDA: estado del juego (conectando, jugando, activo)
// RESTRICCIONES:
// - nickname debe existir en localStorage
// - partidaId actualmente es fijo (debe venir del lobby en producción)
// - requiere conexión socket activa
// OBJETIVO:
// Conectar al jugador a la partida y escuchar eventos del servidor
// ======================================================
export default function Juego() {
  const [estado, setEstado] = useState("conectando");

  useEffect(() => {
    const nickname = localStorage.getItem("nickname");

    // ⚠️ PARTIDA DE PRUEBA
    // En producción este valor debe venir del lobby o URL params
    const partidaId = "partida_1";

    // ======================================================
    // ENTRADA A LA PARTIDA
    // ======================================================
    socket.emit("join_game", {
      partidaId,
      nickname
    });

    // ======================================================
    // EVENTO: ACTUALIZACIÓN DEL MAPA / GALAXIA
    // ENTRADA: datos del servidor (recursos, sistemas, etc.)
    // SALIDA: cambio de estado a "jugando"
    // ======================================================
    const handleUpdate = (data) => {
      console.log("Actualización del juego:", data);
      setEstado("jugando");
    };

    // ======================================================
    // EVENTO: INICIO DE LA PARTIDA
    // ENTRADA: evento del servidor "game_started"
    // SALIDA: estado cambia a "activo"
    // ======================================================
    const handleStart = (data) => {
      console.log("Juego iniciado:", data);
      setEstado("activo");
    };

    socket.on("galaxia_update", handleUpdate);
    socket.on("game_started", handleStart);

    return () => {
      socket.off("galaxia_update", handleUpdate);
      socket.off("game_started", handleStart);
    };
  }, []);

  return (
    <div style={{ color: "white" }}>
      {/* ======================================================
          ESTADO DEL JUEGO
      ====================================================== */}
      <h2>Juego multijugador</h2>

      <p>Estado: {estado}</p>

      {estado === "conectando" && <p>Conectando a la partida...</p>}
      {estado === "jugando" && <p>Esperando inicio...</p>}
      {estado === "activo" && <p>Partida en curso</p>}
    </div>
  );
}