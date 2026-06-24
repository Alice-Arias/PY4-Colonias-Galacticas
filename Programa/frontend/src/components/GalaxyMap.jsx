// ==============================================================================================
// NOMBRE: GalaxyMap
// ENTRADA: estado del mapa, selección y animaciones visuales
// SALIDA: representación interactiva del mapa galáctico
// RESTRICCIONES: mantener sincronía con el estado del juego y los sockets
// OBJETIVO: dibujar el mapa galáctico y la interacción visual
// ==============================================================================================
import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/GalaxyMap.css";
import neutralGalaxyBg from "../assets/backgroundLogin.jpeg";

// ==============================================================================================
// NOMBRE: GalaxyMap
// ENTRADA: sistemas, selección y eventos de interacción
// SALIDA: mapa renderizado en canvas
// RESTRICCIONES: depende de dimensiones del contenedor
// OBJETIVO: visualizar territorio, rutas y movimientos
// ==============================================================================================
export default function GalaxyMap({ sistemas = [], onPlanetSelect, selectedId = null, baseId = null, playerId = null, playerName = null, movimientoVisual = null }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const positionsRef = useRef({});
  const bgImageRef = useRef(null);
  const prevOwnersRef = useRef({});
  const conquestFxRef = useRef([]);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 640 });
  const [animTick, setAnimTick] = useState(0);

  useEffect(() => {
    const img = new Image();
    img.src = neutralGalaxyBg;
    bgImageRef.current = img;
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      const rect = containerRef.current.getBoundingClientRect();
      const altoAjustado = Math.max(420, Math.min(rect.height - 24, 520));
      setContainerSize({
        width: Math.max(rect.width - 40, 420),
        height: altoAjustado,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const positions = useMemo(() => {
    if (!sistemas.length) return {};

    const centerX = containerSize.width / 2;
    const centerY = containerSize.height / 2;
    const radiusX = Math.max(180, containerSize.width * 0.38);
    const radiusY = Math.max(170, containerSize.height * 0.39);
    const angleOffset = -Math.PI / 2;

    const map = {};
    const total = Math.max(1, sistemas.length);

    sistemas.forEach((sistema, index) => {
      const angle = angleOffset + (index / total) * Math.PI * 2;
      map[sistema.id] = {
        x: centerX + Math.cos(angle) * radiusX,
        y: centerY + Math.sin(angle) * radiusY,
      };
    });

    return map;
  }, [containerSize.height, containerSize.width, sistemas]);

  const graphStateToken = useMemo(
    () => sistemas
      .map((s) => `${s.id}:${s.propietarioId || "n"}:${s.flotas || 0}:${s.bajoAtaque ? 1 : 0}`)
      .join("|"),
    [sistemas]
  );

  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  useEffect(() => {
    const id = setInterval(() => setAnimTick((prev) => prev + 1), 40);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const now = Date.now();
    const prevOwners = prevOwnersRef.current;
    const nextOwners = {};

    sistemas.forEach((sistema) => {
      const ownerKey = sistema.propietarioId || String(sistema.propietario || "").toLowerCase() || "neutral";
      const previousOwner = prevOwners[sistema.id];

      if (previousOwner && previousOwner !== ownerKey) {
        conquestFxRef.current.push({ id: sistema.id, startedAt: now });
      }

      nextOwners[sistema.id] = ownerKey;
    });

    prevOwnersRef.current = nextOwners;
    conquestFxRef.current = conquestFxRef.current.filter((fx) => now - fx.startedAt < 1500);
  }, [sistemas]);

  useEffect(() => {
    if (!canvasRef.current || sistemas.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const bgImage = bgImageRef.current;
    if (bgImage?.complete) {
      ctx.drawImage(bgImage, 0, 0, width, height);
      ctx.fillStyle = "rgba(5, 12, 24, 0.66)";
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = "#06111f";
      ctx.fillRect(0, 0, width, height);
    }

    ctx.strokeStyle = "rgba(73, 132, 203, 0.16)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 6; i++) {
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, i * 46, i * 42, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(angle) * 330, centerY + Math.sin(angle) * 300);
      ctx.stroke();
    }

    const coreGradient = ctx.createRadialGradient(centerX, centerY, 8, centerX, centerY, 90);
    coreGradient.addColorStop(0, "rgba(148, 226, 255, 0.9)");
    coreGradient.addColorStop(0.35, "rgba(72, 170, 255, 0.45)");
    coreGradient.addColorStop(1, "rgba(25, 58, 103, 0)");
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 90, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(148, 226, 255, 0.48)";
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 24 + i * 16, 12 + i * 11, Math.PI / 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    const iconByType = {
      minero: "⛏",
      energetico: "⚡",
      cientifico: "🧪",
      balanceado: "🪐",
    };

    const rutasUnicas = [];
    const visitadas = new Set();

    sistemas.forEach((sistema) => {
      const origen = sistema.id;
      const conexiones = Array.isArray(sistema.conexiones) ? sistema.conexiones : [];

      conexiones.forEach((destino) => {
        const key = [origen, destino].sort().join("|");
        if (visitadas.has(key)) return;
        visitadas.add(key);
        rutasUnicas.push([origen, destino]);
      });
    });

  
    ctx.strokeStyle = "rgba(108, 185, 255, 0.26)";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(92, 165, 255, 0.3)";
    ctx.shadowBlur = 8;
    rutasUnicas.forEach(([origen, destino]) => {
      const fromPos = positions[origen];
      const toPos = positions[destino];
      if (!fromPos || !toPos) return;
      ctx.beginPath();
      ctx.moveTo(fromPos.x, fromPos.y);
      ctx.lineTo(toPos.x, toPos.y);
      ctx.stroke();
    });

    if (movimientoVisual?.origenId && movimientoVisual?.destinoId) {
      const fromPos = positions[movimientoVisual.origenId];
      const toPos = positions[movimientoVisual.destinoId];
      if (fromPos && toPos) {
        const esAtaque = movimientoVisual.tipo === "ataque";
        const color = esAtaque ? "#ff8a8a" : "#8affc5";

        ctx.strokeStyle = esAtaque ? "rgba(255, 104, 104, 0.9)" : "rgba(66, 245, 155, 0.9)";
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 8]);
        ctx.lineDashOffset = -(animTick * 3);
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        ctx.stroke();
        ctx.setLineDash([]);

        const progreso = ((animTick % 25) / 25);
        const x = fromPos.x + (toPos.x - fromPos.x) * progreso;
        const y = fromPos.y + (toPos.y - fromPos.y) * progreso;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Segunda pasada: línea principal recta y nítida.
    ctx.strokeStyle = "rgba(124, 204, 255, 0.98)";
    ctx.lineWidth = 2.6;
    ctx.shadowBlur = 0;
    rutasUnicas.forEach(([origen, destino]) => {
      const fromPos = positions[origen];
      const toPos = positions[destino];
      if (!fromPos || !toPos) return;
      ctx.beginPath();
      ctx.moveTo(fromPos.x, fromPos.y);
      ctx.lineTo(toPos.x, toPos.y);
      ctx.stroke();
    });

    ctx.lineCap = "butt";
    ctx.shadowBlur = 0;
    const now = Date.now();
    conquestFxRef.current = conquestFxRef.current.filter((fx) => now - fx.startedAt < 1500);

    sistemas.forEach((sistema) => {
      const pos = positions[sistema.id];
      if (!pos) return;

      const isSelected = selectedId === sistema.id;
      const isBase = baseId === sistema.id;
      const propietarioId = String(sistema.propietarioId || "").trim();
      const jugadorId = String(playerId || "").trim();
      const propietarioNombre = String(sistema.propietario || "").trim().toLowerCase();
      const jugadorNombre = String(playerName || "").trim().toLowerCase();
      const isMine = (propietarioId && jugadorId && propietarioId === jugadorId)
        || (propietarioNombre && jugadorNombre && propietarioNombre === jugadorNombre);
      const isEnemy = !isMine && Boolean(sistema.propietarioId || sistema.propietario);
      const isAttacked = sistema.bajoAtaque;
      const ringRadius = isSelected ? 22 : isBase ? 20 : 18;
      const coreRadius = isSelected ? 12 : isBase ? 11 : 10;
      const glowRadius = ringRadius + (isSelected ? 14 : 12);
      const conquestFx = conquestFxRef.current.filter((fx) => fx.id === sistema.id);

      const tone = {
        hex: "#f7fbff",
        rgb: "247, 251, 255",
      };

      if (isMine && isBase) {
        tone.hex = "#ffd166";
        tone.rgb = "255, 209, 102";
      } else if (isMine) {
        tone.hex = "#3ce77b";
        tone.rgb = "60, 231, 123";
      } else if (isEnemy) {
        tone.hex = "#ff5b5b";
        tone.rgb = "255, 91, 91";
      }

      if (isAttacked) {
        tone.hex = "#ff9d00";
        tone.rgb = "255, 157, 0";
      }

      if (isSelected) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, glowRadius + 7, 0, Math.PI * 2);
        ctx.fill();
      }

      const haloGradient = ctx.createRadialGradient(pos.x, pos.y, coreRadius, pos.x, pos.y, glowRadius);
      haloGradient.addColorStop(0, `rgba(${tone.rgb}, 0.44)`);
      haloGradient.addColorStop(0.58, `rgba(${tone.rgb}, 0.24)`);
      haloGradient.addColorStop(1, `rgba(${tone.rgb}, 0)`);
      ctx.fillStyle = haloGradient;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      if (isAttacked) {
        const pulse = (Math.sin(animTick * 0.35) + 1) / 2;
        const attackRadius = ringRadius + 8 + pulse * 5;
        ctx.strokeStyle = `rgba(255, 95, 95, ${0.35 + pulse * 0.35})`;
        ctx.lineWidth = 1.4 + pulse * 1.1;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, attackRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      conquestFx.forEach((fx, index) => {
        const elapsed = now - fx.startedAt;
        const progress = Math.max(0, Math.min(1, elapsed / 1500));
        const waveRadius = ringRadius + 4 + progress * 26 + index * 2;
        const alpha = (1 - progress) * 0.55;

        if (alpha <= 0) return;

        ctx.strokeStyle = `rgba(${tone.rgb}, ${alpha})`;
        ctx.lineWidth = 1.2 + (1 - progress) * 1.4;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, waveRadius, 0, Math.PI * 2);
        ctx.stroke();
      });

      ctx.strokeStyle = `rgba(${tone.rgb}, ${isSelected ? "0.9" : "0.72"})`;
      ctx.lineWidth = isSelected ? 2.8 : 2.2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(${tone.rgb}, 0.36)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, ringRadius - 4, 0, Math.PI * 2);
      ctx.stroke();

      const coreGradient = ctx.createRadialGradient(pos.x - 2, pos.y - 3, 2, pos.x, pos.y, coreRadius + 2);
      coreGradient.addColorStop(0, "#ffffff");
      coreGradient.addColorStop(0.65, "#f5f9ff");
      coreGradient.addColorStop(1, `rgba(${tone.rgb}, 0.88)`);
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#11233a";
      ctx.font = "12px Segoe UI";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(iconByType[sistema.tipo] || "⬢", pos.x, pos.y);

      if (isBase) {
        ctx.fillStyle = "#ffe08a";
        ctx.font = "bold 11px Segoe UI";
        ctx.fillText("BASE", pos.x, pos.y - ringRadius - 14);
      }

      ctx.fillStyle = "#eaf4ff";
      ctx.font = "bold 14px Segoe UI";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sistema.nombre, pos.x, pos.y + ringRadius + 18);
    });
  }, [baseId, positions, selectedId, sistemas, playerId, playerName, graphStateToken, movimientoVisual, animTick]);

  // ==============================================================================================
  // NOMBRE: handleCanvasClick
  // ENTRADA: evento click del canvas
  // SALIDA: notifica planeta seleccionado cuando corresponde
  // RESTRICCIONES: requiere coordenadas y mapa de posiciones
  // OBJETIVO: traducir clics de usuario a selección de sistema
  // ==============================================================================================
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const nodePositions = positionsRef.current;

    for (const sistema of sistemas) {
      const pos = nodePositions[sistema.id];
      if (!pos) continue;

      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance < 30) {
        onPlanetSelect?.(sistema);
        return;
      }
    }
  };

  return (
    <div className="galaxy-map" ref={containerRef}>
      <div className="map-header">
        <div>
          <h2>Mapa Galáctico</h2>
          <p className="map-subtitle">Selecciona nodo y ejecuta acciones. La trayectoria de flota se dibuja al enviar.</p>
        </div>
        <div className="legend">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: "#f7fbff" }}></span>
            <span>Neutral</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: "#ffd166" }}></span>
            <span>Tu base</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: "#33d17a" }}></span>
            <span>Tus sistemas</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: "#ff5b5b" }}></span>
            <span>Enemigo</span>
          </div>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={containerSize.width}
        height={containerSize.height}
        onClick={handleCanvasClick}
        className="galaxy-canvas"
        style={{ cursor: "pointer" }}
      />
    </div>
  );
}
