import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import socket from "../services/socket";
import ResourceBar from "../components/ResourceBar";
import GalaxyMap from "../components/GalaxyMap";
import PlanetPanel from "../components/PlanetPanel";
import EventLog from "../components/EventLog";
import "../styles/Juego.css";

const COSTOS = {
  mina: "100 minerales",
  central: "80 minerales + 50 energía + 200 cristales",
  astillero: "150 minerales + 100 energía + 10 cristales",
  fortaleza: "200 minerales + 100 energía + 30 cristales",
};

const COSTOS_DETALLE = {
  mina: { minerales: 100, energia: 0, cristales: 0 },
  central: { minerales: 80, energia: 50, cristales: 200 },
  astillero: { minerales: 150, energia: 100, cristales: 10 },
  fortaleza: { minerales: 200, energia: 100, cristales: 30 },
};

const COSTO_ENVIO_POR_FLOTA = {
  minerales: 3,
  energia: 5,
  cristales: 1,
};

function formatearTiempo(segundos) {
  const total = Math.max(0, Math.floor(Number(segundos) || 0));
  const min = Math.floor(total / 60);
  const seg = total % 60;
  return `${min}:${String(seg).padStart(2, "0")}`;
}

function transformarEstadoServidor(estado) {
  const galaxia = estado?.galaxia || {};
  return (galaxia.sistemas || []).map((sistema) => ({
    id: sistema.id,
    nombre: sistema.nombre,
    propietario: sistema.controladoPor || sistema.propietario || null,
    propietarioId: sistema.propietarioId || null,
    tipo: sistema.tipo,
    x: sistema.x,
    y: sistema.y,
    conexiones: (galaxia.rutas || [])
      .filter(([a, b]) => a === sistema.id || b === sistema.id)
      .map(([a, b]) => (a === sistema.id ? b : a)),
    produccion: sistema.produccion || { minerales: 0, energia: 0, cristales: 0 },
    recursos: sistema.recursos || { minerales: 0, energia: 0, cristales: 0 },
    flotas: sistema.flotas || 0,
    minas: sistema.minas || 0,
    centrales: sistema.centrales || 0,
    astilleros: sistema.astilleros || 0,
    fortalezas: sistema.fortalezas || 0,
    bajoAtaque: sistema.bajoAtaque || false,
  }));
}

function getPlayerState(estado, playerName, playerSocketId) {
  const jugadores = estado?.jugadores || [];
  const porSocket = jugadores.find((item) => item.socketId === playerSocketId);
  if (porSocket) return porSocket;

  const jugador = jugadores.find((item) => item.nickname === playerName);
  return jugador || null;
}

function inferSelectedDetails(sistema, playerState) {
  if (!sistema) return null;

  return {
    nombre: sistema.nombre,
    propietario: sistema.propietario,
    tipo: sistema.tipo,
    produccion: sistema.produccion,
    flotas: sistema.flotas,
    instalaciones: {
      Mina: sistema.minas,
      "Centro Investigación": sistema.centrales,
      Astillero: sistema.astilleros,
      Fortaleza: sistema.fortalezas,
    },
    recursos: sistema.recursos,
    bajoAtaque: sistema.bajoAtaque,
    controladoPorUsuario: playerState?.sistemas?.includes(sistema.id),
  };
}

export default function Juego() {
  const playerName = sessionStorage.getItem("nickname") || localStorage.getItem("nickname") || "Ali";
  const location = useLocation();
  const partidaId = useMemo(
    () => location.state?.partidaId || sessionStorage.getItem("partidaId") || localStorage.getItem("partidaId") || "",
    [location.state]
  );

  const [estadoServidor, setEstadoServidor] = useState(null);
  const [estado, setEstado] = useState("conectando");
  const [mensajeInicio, setMensajeInicio] = useState("Conectando a la partida...");
  const [countdown, setCountdown] = useState(null);
  const [inicioPartida, setInicioPartida] = useState(null);
  const [partidaTimer, setPartidaTimer] = useState(0);
  const [seleccionado, setSeleccionado] = useState(null);
  const [modalConstruir, setModalConstruir] = useState(false);
  const [modalFlota, setModalFlota] = useState(false);
  const [modalDetalles, setModalDetalles] = useState(false);
  const [modalBatalla, setModalBatalla] = useState(false);
  const [eventoBatalla, setEventoBatalla] = useState(null);
  const [sistemas, setSistemas] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [playerSocketId, setPlayerSocketId] = useState(socket.id || null);
  const [produccionTimer, setProduccionTimer] = useState(20);
  const [ganador, setGanador] = useState(null);
  const [alertaAtaque, setAlertaAtaque] = useState("");
  const [formConstruccion, setFormConstruccion] = useState("mina");
  const [formFlota, setFormFlota] = useState({ destino: "", cantidad: 1 });
  const [inicioHabilitado, setInicioHabilitado] = useState(false);
  const [countdownInicioU, setCountdownInicioU] = useState(null);
  const temporizadorModalBatallaRef = useRef(null);

  const playerState = getPlayerState(estadoServidor, playerName, playerSocketId);
  const recursos = playerState?.recursos || { minerales: 0, energia: 0, cristales: 0 };
  const flotas = estadoServidor?.jugadores?.reduce((total, jugador) => total + (jugador.flotasEnPie || 0), 0) || 0;
  const sistemaInicialId = playerState?.sistemaInicialId || null;
  const sistemaInicial = useMemo(() => {
    return sistemas.find((sistema) => sistema.id === sistemaInicialId) || null;
  }, [sistemaInicialId, sistemas]);

  const temporizadorPartida = estado === "activo" ? partidaTimer : countdown ?? 0;
  const sistemasPropiosNombres = useMemo(() => {
    const ids = new Set(playerState?.sistemas || []);
    return sistemas
      .filter((sistema) => ids.has(sistema.id))
      .map((sistema) => sistema.nombre.toLowerCase());
  }, [playerState?.sistemas, sistemas]);

  const eventosVisibles = useMemo(() => {
    return (eventos || []).filter((evento) => {
      if (!evento) return false;
      if (evento.jugador === "Sistema") return true;
      if (evento.jugador === playerName) return true;

      const mensaje = String(evento.mensaje || "").toLowerCase();
      return sistemasPropiosNombres.some((nombre) => mensaje.includes(nombre));
    });
  }, [eventos, playerName, sistemasPropiosNombres]);

  useEffect(() => {
    if (!sistemaInicial) return;
    if (!seleccionado || !sistemas.some((sistema) => sistema.id === seleccionado.id)) {
      setSeleccionado(sistemaInicial);
    }
  }, [seleccionado, sistemaInicial, sistemas]);

  useEffect(() => {
    if (!seleccionado?.id) return;
    const sistemaActualizado = sistemas.find((sistema) => sistema.id === seleccionado.id);
    if (!sistemaActualizado) return;
    if (sistemaActualizado !== seleccionado) {
      setSeleccionado(sistemaActualizado);
    }
  }, [sistemas, seleccionado]);

  useEffect(() => {
    if (estado !== "activo" || !inicioPartida) {
      setPartidaTimer(0);
      return undefined;
    }

    const tick = () => {
      setPartidaTimer(Math.floor((Date.now() - inicioPartida) / 1000));
    };

    tick();
    const intervalo = setInterval(tick, 1000);
    return () => clearInterval(intervalo);
  }, [estado, inicioPartida]);

  useEffect(() => {
    if (!partidaId) {
      setMensajeInicio("No se encontró el código de partida");
      setEstado("error");
      return;
    }

    const handleLobbyJoin = () => {
      setPlayerSocketId(socket.id || null);
      socket.emit("join_game", { partidaId, nickname: playerName });
    };

    const handleGameStarted = (payload) => {
      setEstado("activo");
      setMensajeInicio("Partida cargada. Presiona U para iniciar");
      setInicioPartida((prev) => prev ?? Date.now());
      if (payload?.estadoJuego) {
        setEstadoServidor(payload.estadoJuego);
        setSistemas(transformarEstadoServidor(payload.estadoJuego));
        setEventos(payload.estadoJuego.eventos || []);
        setProduccionTimer(Math.max(0, Math.floor(payload.estadoJuego.tiempoProduccionRestante ?? 20)));
        setInicioHabilitado(Boolean(payload.estadoJuego.inicioHabilitado));
      }
    };

    const handleGameState = (payload) => {
      setEstadoServidor(payload);
      setSistemas(transformarEstadoServidor(payload));
      setEventos(payload.eventos || []);
      if (typeof payload.tiempoProduccionRestante === "number") {
        setProduccionTimer(payload.tiempoProduccionRestante);
      }
      setInicioHabilitado(Boolean(payload.inicioHabilitado));
      if (payload.ganador) {
        setGanador(payload.ganador);
      }
    };

    const handleCountdown = (segundos) => {
      setCountdown(segundos);
      setMensajeInicio(`La conquista empieza en ${segundos}`);
      setEstado("countdown");
    };

    const handleProductionTimer = ({ segundosRestantes }) => {
      if (typeof segundosRestantes === "number") {
        setProduccionTimer(segundosRestantes);
      }
    };

    const handleCountdownInicioU = ({ segundosRestantes }) => {
      setCountdownInicioU(segundosRestantes);
      setAlertaAtaque(`Inicio en ${segundosRestantes}s...`);
    };

    const handleInicioUCompletado = () => {
      setCountdownInicioU(null);
      setInicioHabilitado(true);
      setAlertaAtaque("Partida activa: ya puedes construir, mover flotas y generar recursos.");
    };

    const handleInicioUResultado = (resultado) => {
      if (!resultado?.exito) {
        setAlertaAtaque(resultado?.mensaje || "No se pudo iniciar con tecla U.");
      }
    };

    const handleBattleStart = (data) => {
      if (temporizadorModalBatallaRef.current) {
        clearTimeout(temporizadorModalBatallaRef.current);
      }
      setEventoBatalla({ tipo: "inicio", ...data });
      setModalBatalla(true);
      temporizadorModalBatallaRef.current = setTimeout(() => {
        setModalBatalla(false);
      }, 3500);
      if (data?.defensor === playerName) {
        setAlertaAtaque(`Ataque entrante en ${data.sistemaNombre}: ${data.flotasAtacantes} flotas enemigas.`);
      }
    };

    const handleBattleResult = (data) => {
      if (temporizadorModalBatallaRef.current) {
        clearTimeout(temporizadorModalBatallaRef.current);
        temporizadorModalBatallaRef.current = null;
      }
      setEventoBatalla({ tipo: "resultado", ...data });
      setModalBatalla(true);
      if (data?.ganador) {
        setEventos((prev) => [
          {
            hora: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
            jugador: data.ganador,
            mensaje: `ganó la batalla en ${data.sistemaNombre}`,
            tipo: data.ataqueGana ? "battle" : "eliminated",
            color: data.ataqueGana ? "#00ff88" : "#ff4444",
          },
          ...prev,
        ]);
      }
    };

    const handleGameOver = (data) => {
      setGanador(data.ganador);
      setEventos(data.eventos || []);
      setEstado("finalizada");
    };

    const handleConstruirResultado = (resultado) => {
      setAlertaAtaque(
        resultado?.mensaje || (resultado?.exito ? "Construcción realizada." : "No se pudo construir en el sistema seleccionado.")
      );
      socket.emit("get_game_state", partidaId);
    };

    const handleFlotasResultado = (resultado) => {
      if (!resultado?.exito) {
        setAlertaAtaque(resultado?.mensaje || "No se pudo enviar la flota.");
      }
      socket.emit("get_game_state", partidaId);
    };

    socket.on("connect", handleLobbyJoin);
    socket.on("game_started", handleGameStarted);
    socket.on("game_state_update", handleGameState);
    socket.on("countdown", handleCountdown);
    socket.on("production_timer", handleProductionTimer);
    socket.on("countdown_inicio_u", handleCountdownInicioU);
    socket.on("inicio_u_completado", handleInicioUCompletado);
    socket.on("inicio_u_resultado", handleInicioUResultado);
    socket.on("battle_start", handleBattleStart);
    socket.on("battle_result", handleBattleResult);
    socket.on("game_over", handleGameOver);
    socket.on("construir_resultado", handleConstruirResultado);
    socket.on("flotas_resultado", handleFlotasResultado);

    setPlayerSocketId(socket.id || null);
    socket.emit("join_game", { partidaId, nickname: playerName });
    socket.emit("get_game_state", partidaId);

    return () => {
      socket.off("connect", handleLobbyJoin);
      socket.off("game_started", handleGameStarted);
      socket.off("game_state_update", handleGameState);
      socket.off("countdown", handleCountdown);
      socket.off("production_timer", handleProductionTimer);
      socket.off("countdown_inicio_u", handleCountdownInicioU);
      socket.off("inicio_u_completado", handleInicioUCompletado);
      socket.off("inicio_u_resultado", handleInicioUResultado);
      socket.off("battle_start", handleBattleStart);
      socket.off("battle_result", handleBattleResult);
      socket.off("game_over", handleGameOver);
      socket.off("construir_resultado", handleConstruirResultado);
      socket.off("flotas_resultado", handleFlotasResultado);
      if (temporizadorModalBatallaRef.current) {
        clearTimeout(temporizadorModalBatallaRef.current);
        temporizadorModalBatallaRef.current = null;
      }
    };
  }, [partidaId, playerName]);

  useEffect(() => {
    if (estado !== "activo" || inicioHabilitado) return;

    const onKeyDown = (evento) => {
      if (String(evento.key || "").toLowerCase() !== "u") return;
      if (!partidaId) return;
      socket.emit("presionar_tecla_u", { partidaId });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [estado, inicioHabilitado, partidaId]);

  const planetaSeleccionado = useMemo(() => {
    if (!seleccionado) return null;
    return inferSelectedDetails(seleccionado, playerState);
  }, [seleccionado, playerState]);

  const handlePlanetSelect = (sistema) => {
    setSeleccionado(sistema);
    setModalDetalles(true);
  };

  const abrirDetalles = () => {
    if (!seleccionado) return;
    setModalBatalla(false);
    setModalDetalles(true);
  };

  const abrirConstruccion = () => {
    if (!seleccionado) return;
    if (!inicioHabilitado) {
      setAlertaAtaque("Debes presionar U para iniciar la partida.");
      return;
    }
    setModalConstruir(true);
  };

  const abrirFlotas = () => {
    if (!seleccionado) return;
    if (!inicioHabilitado) {
      setAlertaAtaque("Debes presionar U para iniciar la partida.");
      return;
    }
    setFormFlota({ destino: "", cantidad: 1 });
    setModalFlota(true);
  };

  const enviarConstruccion = () => {
    if (!seleccionado) return;
    socket.emit("construir", {
      partidaId,
      sistemaId: seleccionado.id,
      tipoEdificio: formConstruccion,
    });
    setModalConstruir(false);
  };

  const enviarFlotas = () => {
    if (!seleccionado || !formFlota.destino) return;
    socket.emit("enviar_flotas", {
      partidaId,
      origen: seleccionado.id,
      destino: formFlota.destino,
      cantidad: Number(formFlota.cantidad),
    });
    setModalFlota(false);
  };

  const sistemaControlado = playerState?.sistemas?.includes(seleccionado?.id);
  const destinoSeleccionado = sistemas.find((sistema) => sistema.id === formFlota.destino) || null;
  const flotasAtaque = Math.max(0, Number(formFlota.cantidad) || 0);
  const defensaEstimada = destinoSeleccionado
    ? (destinoSeleccionado.flotas || 0) + (destinoSeleccionado.minas || 0) * 3 + (destinoSeleccionado.fortalezas || 0) * 2
    : 0;
  const esCombateDirecto = Boolean(
    destinoSeleccionado &&
    destinoSeleccionado.propietarioId &&
    destinoSeleccionado.propietarioId !== seleccionado?.propietarioId
  );
  const balanceCombate = flotasAtaque - defensaEstimada;
  const costoMovimiento = {
    minerales: COSTO_ENVIO_POR_FLOTA.minerales * flotasAtaque,
    energia: COSTO_ENVIO_POR_FLOTA.energia * flotasAtaque,
    cristales: COSTO_ENVIO_POR_FLOTA.cristales * flotasAtaque,
  };
  const costoConstruccionSeleccionada = COSTOS_DETALLE[formConstruccion] || { minerales: 0, energia: 0, cristales: 0 };
  const puedeConstruirSegunRecursos =
    recursos.minerales >= costoConstruccionSeleccionada.minerales &&
    recursos.energia >= costoConstruccionSeleccionada.energia &&
    recursos.cristales >= costoConstruccionSeleccionada.cristales;

  if (estado === "conectando") {
    return (
      <div className="game-connecting">
        <div className="connecting-content">
          <h2>{mensajeInicio}</h2>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (estado === "error") {
    return (
      <div className="game-connecting">
          <h2>{mensajeInicio}</h2>
          <p style={{ color: "#fff", marginTop: "12px" }}>
            Vuelve al lobby y entra de nuevo a la partida.
          </p>
      </div>
    );
  }

  return (
    <div className="game-container">
      <ResourceBar
        playerName={playerName}
        minerales={recursos.minerales}
        energia={recursos.energia}
        cristales={recursos.cristales}
        flotas={flotas}
        produccionTiempo={formatearTiempo(produccionTimer)}
        partidaTiempo={formatearTiempo(temporizadorPartida)}
        estado={estado}
      />

      <div className="game-main">
        <div className="game-map-container">
          <GalaxyMap
            sistemas={sistemas}
            selectedId={seleccionado?.id}
            baseId={sistemaInicial?.id}
            playerName={playerName}
            onPlanetSelect={handlePlanetSelect}
          />
        </div>

        <div className="game-right-panel">
          <PlanetPanel
            planeta={planetaSeleccionado}
            esBaseInicial={Boolean(seleccionado && sistemaInicial && seleccionado.id === sistemaInicial.id)}
            esPropio={Boolean(sistemaControlado && inicioHabilitado)}
            onBuild={abrirConstruccion}
            onSendFleet={abrirFlotas}
            onDetails={abrirDetalles}
          />
        </div>
      </div>

      {!inicioHabilitado && (
        <div className="inicio-u-overlay">
          <h3>Presiona U para iniciar</h3>
          <p>Hasta iniciar, no se pueden construir acciones ni generar recursos.</p>
          {countdownInicioU !== null && <strong>Arranque en {countdownInicioU}s</strong>}
        </div>
      )}

      <div className="game-events">
        <EventLog eventos={eventosVisibles} />
      </div>

      {modalDetalles && planetaSeleccionado && (
        <div className="game-modal-backdrop" onClick={() => setModalDetalles(false)}>
          <div className="game-modal game-details-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{planetaSeleccionado.nombre}</h3>
            <div className="detail-modal-grid">
              <div>
                <span className="detail-modal-label">Propietario</span>
                <strong>{planetaSeleccionado.propietario || "Neutral"}</strong>
              </div>
              <div>
                <span className="detail-modal-label">Tipo</span>
                <strong>{planetaSeleccionado.tipo}</strong>
              </div>
              <div>
                <span className="detail-modal-label">Control</span>
                <strong>{planetaSeleccionado.controladoPorUsuario ? "Tu sistema" : "No controlado"}</strong>
              </div>
              <div>
                <span className="detail-modal-label">Flotas</span>
                <strong>{planetaSeleccionado.flotas || 0}</strong>
              </div>
            </div>
            <div className="detail-modal-stats">
              <p>Producción por ciclo: {planetaSeleccionado.produccion?.minerales || 0} minerales, {planetaSeleccionado.produccion?.energia || 0} energía, {planetaSeleccionado.produccion?.cristales || 0} cristales.</p>
              <p>Instalaciones activas: {Object.entries(planetaSeleccionado.instalaciones || {}).map(([tipo, cantidad]) => `${tipo}: ${cantidad}`).join(" | ") || "Sin instalaciones"}</p>
            </div>
            <div className="modal-actions">
              <button className="modal-confirm" onClick={() => setModalDetalles(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {modalConstruir && seleccionado && (
        <div className="game-modal-backdrop" onClick={() => setModalConstruir(false)}>
          <div className="game-modal" onClick={(e) => e.stopPropagation()}>
            <h3>CONSTRUIR EN {seleccionado.nombre}</h3>
            <div className="modal-list">
              {Object.entries(COSTOS).map(([tipo, costo]) => (
                <button
                  key={tipo}
                  className={`modal-option ${formConstruccion === tipo ? "active" : ""}`}
                  onClick={() => setFormConstruccion(tipo)}
                >
                  <span>{tipo === "central" ? "Centro de Investigación" : tipo.charAt(0).toUpperCase() + tipo.slice(1)}</span>
                  <small>{costo}</small>
                </button>
              ))}
            </div>
            <small className="modal-help">
              Recursos actuales: {recursos.minerales} minerales / {recursos.energia} energía / {recursos.cristales} cristales
            </small>
            <small className="modal-help">
              Costo seleccionado: {costoConstruccionSeleccionada.minerales} minerales / {costoConstruccionSeleccionada.energia} energía / {costoConstruccionSeleccionada.cristales} cristales
            </small>
            {!puedeConstruirSegunRecursos && (
              <small className="modal-help" style={{ color: "#ff9c9c" }}>
                Recursos insuficientes para esta construcción.
              </small>
            )}
            <div className="modal-actions">
              <button className="modal-confirm" onClick={enviarConstruccion} disabled={!puedeConstruirSegunRecursos}>Construir</button>
              <button className="modal-cancel" onClick={() => setModalConstruir(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {modalFlota && seleccionado && (
        <div className="game-modal-backdrop" onClick={() => setModalFlota(false)}>
          <div className="game-modal" onClick={(e) => e.stopPropagation()}>
            <h3>ENVIAR FLOTA</h3>
            <label>
              Desde
              <input value={seleccionado.nombre} readOnly />
            </label>
            <label>
              Destino
              <select value={formFlota.destino} onChange={(e) => setFormFlota((prev) => ({ ...prev, destino: e.target.value }))}>
                <option value="">Seleccionar destino</option>
                {sistemas
                  .filter((sistema) => sistema.id !== seleccionado.id)
                  .map((sistema) => (
                    <option key={sistema.id} value={sistema.id}>
                      {sistema.nombre}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Flotas a enviar
              <input
                type="number"
                min="1"
                max={Math.max(1, seleccionado.flotas || 1)}
                value={formFlota.cantidad}
                onChange={(e) => setFormFlota((prev) => ({ ...prev, cantidad: e.target.value }))}
              />
            </label>
            {destinoSeleccionado && (
              <div className="fleet-preview">
                <h4>Vista previa de envío</h4>
                <p>Origen: {seleccionado.nombre} ({seleccionado.flotas || 0} flotas)</p>
                <p>Destino: {destinoSeleccionado.nombre}</p>
                <p>Flotas a enviar: {flotasAtaque}</p>
                <p>
                  Costo movimiento: <strong>{costoMovimiento.minerales} minerales / {costoMovimiento.energia} energía / {costoMovimiento.cristales} cristales</strong>
                </p>
                {esCombateDirecto ? (
                  <>
                    <p>Defensa estimada destino: {defensaEstimada}</p>
                    <p className={balanceCombate >= 0 ? "preview-favorable" : "preview-risk"}>
                      {balanceCombate >= 0
                        ? `Ventaja estimada: +${balanceCombate} para el ataque`
                        : `Riesgo estimado: ${Math.abs(balanceCombate)} por debajo de la defensa`}
                    </p>
                  </>
                ) : (
                  <p className="preview-favorable">No hay combate directo estimado en este envío.</p>
                )}
              </div>
            )}
            <small className="modal-help">Disponibles en origen: {seleccionado.flotas || 0} flotas</small>
            <small className="modal-help">
              Solo puedes enviar si la ruta es válida y el sistema no está siendo atacado.
            </small>
            <div className="modal-actions">
              <button className="modal-confirm" onClick={enviarFlotas}>Enviar Flota</button>
              <button className="modal-cancel" onClick={() => setModalFlota(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {modalBatalla && eventoBatalla && (
        <div className="game-modal-backdrop" onClick={() => setModalBatalla(false)}>
          <div className="game-modal game-battle-modal" onClick={(e) => e.stopPropagation()}>
            {eventoBatalla.tipo === "inicio" ? (
              <>
                <h3>BATALLA EN {eventoBatalla.sistemaNombre}</h3>
                <p>{eventoBatalla.atacante} ataca a {eventoBatalla.defensor}</p>
                <p>Flotas atacantes: {eventoBatalla.flotasAtacantes}</p>
                <p>Defensa total: {eventoBatalla.defensa?.flotas || 0}</p>
              </>
            ) : (
              <>
                <h3>RESULTADO DE BATALLA</h3>
                <p>Ganador: {eventoBatalla.ganador}</p>
                <p>Derrotado: {eventoBatalla.derrotado || "-"}</p>
                <p>Sistema: {eventoBatalla.sistemaNombre}</p>
                <p>Flotas restantes: {eventoBatalla.flotasRestantes || 0}</p>
                {eventoBatalla.planetaConquistado && (
                  <p>Conquistador del planeta: {eventoBatalla.conquistador || eventoBatalla.ganador}</p>
                )}
              </>
            )}
            <div className="modal-actions">
              <button className="modal-confirm" onClick={() => setModalBatalla(false)}>Ver detalles</button>
            </div>
          </div>
        </div>
      )}

      {ganador && (
        <div className="game-over-banner">
          <h2>Ganador: {ganador}</h2>
        </div>
      )}

      {alertaAtaque && (
        <div className="game-alert-banner" onClick={() => setAlertaAtaque("")}>{alertaAtaque}</div>
      )}
    </div>
  );
}
