export default function Ranking() {

  // ======================================================
  // cAMBIAR ES PREDEFINIDO
  // NOMBRE: Ranking (Pantalla de clasificación de jugadores)
  // ENTRADA: Datos de ranking (actualmente hardcodeados)
  // ======================================================
  const ranking = [
    { jugador: "Ali", puntos: 1500 },
    { jugador: "Ana", puntos: 1200 },
    { jugador: "Luis", puntos: 900 }
  ];

  return (
    <div>
      {/* ======================================================
          TÍTULO DEL RANKING
      ====================================================== */}
      <h1>Ranking</h1>

      {/* ======================================================
          LISTA DE JUGADORES
      ====================================================== */}
      {ranking.map((j, i) => (
        <p key={i}>
          {j.jugador} - {j.puntos}
        </p>
      ))}
    </div>
  );
}