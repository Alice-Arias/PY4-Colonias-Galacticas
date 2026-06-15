import "../styles/Ranking.css";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import backgroundLogin from "../assets/backgroundLogin.jpeg";

const POS_CLASS = { 0: "pos-1", 1: "pos-2", 2: "pos-3" };
const ROW_CLASS = { 0: "top-1", 1: "top-2", 2: "top-3" };

export default function Ranking() {
    const navigate = useNavigate();
    const fxRef = useRef(null);

    useEffect(() => {
        const el = fxRef.current;
        if (!el) return;
        for (let i = 0; i < 14; i++) {
            const line = document.createElement("div");
            line.className = "warp-line";
            const w = Math.random() * 120 + 40;
            line.style.cssText = `
                top: ${Math.random() * 100}%;
                left: 0;
                width: ${w}px;
                --dur: ${(Math.random() * 5 + 3).toFixed(1)}s;
                --delay: -${(Math.random() * 8).toFixed(1)}s;
            `;
            el.appendChild(line);
        }
    }, []);

    const ranking = [
        { jugador: "Ali",  puntos: 1500 },
        { jugador: "Ana",  puntos: 1200 },
        { jugador: "Luis", puntos: 900  },
    ];

    return (
        <div
            className="ranking-page"
            style={{ backgroundImage: `url(${backgroundLogin})` }}
        >
            <div className="ranking-bg-fx" ref={fxRef}></div>

            <div className="ranking-overlay">
                <div className="ranking-card">

                    <div className="ranking-header">
                        <span className="ranking-eyebrow">◆ Colonias Galácticas ◆</span>
                        <h1 className="ranking-title">Ranking</h1>
                    </div>

                    <p className="ranking-section-label">Clasificación de comandantes</p>

                    <div className="ranking-list">
                        {ranking.map((j, i) => (
                            <div
                                key={i}
                                className={`ranking-row ${ROW_CLASS[i] ?? ""}`}
                            >
                                <span className={`ranking-pos ${POS_CLASS[i] ?? "pos-n"}`}>
                                    #{i + 1}
                                </span>
                                
                                <span className={`ranking-name ${i < 3 ? "top-name" : ""}`}>
                                    {j.jugador}
                                </span>
                                <span className={`ranking-score ${i === 0 ? "gold" : ""}`}>
                                    {j.puntos} pts
                                </span>
                            </div>
                        ))}
                    </div>

                    <button className="ranking-btn-back" onClick={() => navigate("/")}>
                        Volver al inicio
                    </button>

                </div>
            </div>
        </div>
    );
}