import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/GalaxyMap.css";
import neutralGalaxyBg from "../assets/backgroundLogin.jpeg";

export default function GalaxyMap({ sistemas = [], onPlanetSelect, selectedId = null, baseId = null }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const positionsRef = useRef({});
  const bgImageRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 640 });

  useEffect(() => {
    const img = new Image();
    img.src = neutralGalaxyBg;
    bgImageRef.current = img;
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({
        width: Math.max(rect.width - 40, 420),
        height: Math.max(rect.height - 24, 600),
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

  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

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

    // Primera pasada: halo suave para que el camino se perciba sobre el fondo.
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

    sistemas.forEach((sistema) => {
      const pos = positions[sistema.id];
      if (!pos) return;

      const isSelected = selectedId === sistema.id;
      const isBase = baseId === sistema.id;
      const isConquered = Boolean(sistema.propietarioId);
      const radius = isSelected ? 29 : isBase ? 25 : 21;

      if (isSelected) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 10, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isBase) {
        ctx.strokeStyle = "rgba(255, 209, 102, 0.95)";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      let color = "#3ce77b";
      if (isConquered) color = "#ff5b5b";
      if (isBase) color = "#ffd166";

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = isBase || isSelected ? 18 : 12;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = isSelected ? "#ffffff" : "rgba(255,255,255,0.55)";
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.stroke();

      ctx.fillStyle = "#d9f4ff";
      ctx.font = "14px Segoe UI";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(iconByType[sistema.tipo] || "⬢", pos.x, pos.y);

      if (isBase) {
        ctx.fillStyle = "#ffe08a";
        ctx.font = "bold 11px Segoe UI";
        ctx.fillText("BASE", pos.x, pos.y - radius - 14);
      } else if (isConquered) {
        ctx.fillStyle = "#ffb3b3";
        ctx.font = "bold 10px Segoe UI";
        ctx.fillText("CONQUISTADO", pos.x, pos.y - radius - 14);
      }

      ctx.fillStyle = "#eaf4ff";
      ctx.font = "bold 14px Segoe UI";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sistema.nombre, pos.x, pos.y + radius + 20);
    });
  }, [baseId, positions, selectedId, sistemas]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
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
          <p className="map-subtitle">Cada jugador arranca en una base distinta. Amarillo: base, verde: neutral, rojo: conquistado.</p>
        </div>
        <div className="legend">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: "#ffd166" }}></span>
            <span>Base inicial</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: "#33d17a" }}></span>
            <span>Neutral</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: "#ff5b5b" }}></span>
            <span>Conquistado</span>
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
