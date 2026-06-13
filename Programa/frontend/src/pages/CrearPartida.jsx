import { useState } from "react";
import socket from "../services/socket";
import { useNavigate } from "react-router-dom";

// ======================================================
// NOMBRE: CrearPartida (Interfaz de creación de partida)
// ENTRADA: datos del usuario (nombre, configuración de partida)
// SALIDA: creación de partida en el servidor y redirección a lobby
// RESTRICCIONES:
// - El nombre de la partida no puede estar vacío
// - Los valores numéricos deben convertirse a Number
// - Debe existir conexión activa con socket
// OBJETIVO:
// Permitir a un jugador crear una nueva partida multijugador
// ======================================================
export default function CrearPartida() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [galaxia, setGalaxia] = useState("Nebulosa Orion");
  const [maxJugadores, setMaxJugadores] = useState(2);
  const [tiempoMax, setTiempoMax] = useState(300);
  const [tiempoEspera, setTiempoEspera] = useState(60);
  const [nivelRecursos, setNivelRecursos] = useState("normal");

  // ======================================================
  // NOMBRE: crear partida
  // ENTRADA: estado del formulario (configuración de partida)
  // SALIDA: evento socket "create_game" al servidor
  // RESTRICCIONES:
  // - Nombre obligatorio
  // - No validar duplicados aquí (se hace en backend)
  // - Debe esperar respuesta del servidor antes de navegar
  // OBJETIVO:
  // Enviar solicitud de creación de partida al backend
  // ======================================================
  const crear = () => {
    if (!nombre.trim()) {
      alert("Ingresa un nombre de partida");
      return;
    }

    const config = {
      nombre,
      galaxia,
      maxJugadores: Number(maxJugadores),
      tiempoMax: Number(tiempoMax),
      tiempoEspera: Number(tiempoEspera),

      recursosIniciales: {
        bajo: { minerales: 100, energia: 50, cristales: 20 },
        normal: { minerales: 300, energia: 150, cristales: 50 },
        alto: { minerales: 500, energia: 250, cristales: 100 }
      }[nivelRecursos]
    };

    socket.emit("create_game", config);

    socket.once("partida_creada", (partida) => {
      alert("Partida creada: " + partida.id);

      navigate("/unirse", {
        state: { partidaId: partida.id }
      });
    });
  };

  return (
    <div>
      <h1>Crear Partida</h1>

      <input
        placeholder="Nombre de la partida"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />

      <select
        value={galaxia}
        onChange={(e) => setGalaxia(e.target.value)}
      >
        <option value="Nebulosa Orion">Nebulosa Orion</option>
      </select>

      <input
        type="number"
        placeholder="Máx jugadores"
        value={maxJugadores}
        onChange={(e) => setMaxJugadores(e.target.value)}
      />

      <input
        type="number"
        placeholder="Tiempo máximo (seg)"
        value={tiempoMax}
        onChange={(e) => setTiempoMax(e.target.value)}
      />

      <input
        type="number"
        placeholder="Tiempo de espera (seg)"
        value={tiempoEspera}
        onChange={(e) => setTiempoEspera(e.target.value)}
      />

      <select
        value={nivelRecursos}
        onChange={(e) => setNivelRecursos(e.target.value)}
      >
        <option value="bajo">Bajo</option>
        <option value="normal">Normal</option>
        <option value="alto">Alto</option>
      </select>

      <button onClick={crear}>
        Crear Partida
      </button>
    </div>
  );
}