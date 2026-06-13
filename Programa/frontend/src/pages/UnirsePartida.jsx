import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import socket from "../services/socket";

// ======================================================
// NOMBRE: UnirsePartida (Sala de espera / Lobby)
// ENTRADA: partidaId (input o navegación), nickname del jugador
// SALIDA: conexión al lobby + actualización en tiempo real
// RESTRICCIONES:
// - requiere nickname en localStorage
// - partidaId debe existir en el servidor
// - requiere conexión socket activa
// OBJETIVO:
// Permitir que los jugadores entren a una partida existente
// ======================================================
export default function UnirsePartida() {
  const location = useLocation();

  const [partidaId, setPartidaId] = useState(
    location.state?.partidaId || ""
  );

  const [lobby, setLobby] = useState(null);

  const nickname = localStorage.getItem("nickname");

  // ======================================================
  // NOMBRE: unirse a partida
  // ENTRADA: partidaId + nickname
  // SALIDA: evento socket join_game al servidor
  // RESTRICCIONES:
  // - no permite IDs vacíos
  // OBJETIVO:
  // Conectar al jugador a una sala existente
  // ======================================================
  const unirse = () => {
    if (!partidaId.trim()) return;

    socket.emit("join_game", {
      partidaId,
      nickname
    });
  };

  // ======================================================
  // NOMBRE: listeners del lobby
  // ENTRADA: eventos del servidor (lobby_update, game_started)
  // SALIDA: actualización UI en tiempo real
  // RESTRICCIONES:
  // - evitar duplicación de listeners
  // - limpiar al desmontar componente
  // OBJETIVO:
  // Mantener sincronizada la sala de espera
  // ======================================================
  useEffect(() => {
    const handleLobby = (data) => {
      setLobby(data);
    };

    const handleStart = (data) => {
      alert(data.mensaje);
    };

    socket.on("lobby_update", handleLobby);
    socket.on("game_started", handleStart);

    return () => {
      socket.off("lobby_update", handleLobby);
      socket.off("game_started", handleStart);
    };
  }, []);

  return (
    <div>
      {/* ======================================================
          TÍTULO LOBBY
      ====================================================== */}
      <h1>Lobby</h1>

      {/* ======================================================
          INPUT DE PARTIDA
      ====================================================== */}
      <input
        placeholder="ID partida"
        value={partidaId}
        onChange={(e) => setPartidaId(e.target.value)}
      />

      {/* ======================================================
          BOTÓN UNIRSE
      ====================================================== */}
      <button onClick={unirse}>
        Unirse
      </button>

      {/* ======================================================
          LISTA DE JUGADORES EN LOBBY
      ====================================================== */}
      {lobby && (
        <div>
          <h2>Jugadores ({lobby.jugadores.length})</h2>

          {lobby.jugadores.map((j) => (
            <p key={j.id}>
              {j.nickname} {j.ready ? " listo" : " esperando"}
            </p>
          ))}

          <p>Estado: {lobby.estado}</p>
        </div>
      )}
    </div>
  );
}