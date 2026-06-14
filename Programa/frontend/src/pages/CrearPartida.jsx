import "../styles/CrearPartida.css";
import { useState, useEffect, useRef } from "react";
import socket from "../services/socket";
import { useNavigate } from "react-router-dom";
import backgroundLogin from "../assets/backgroundLogin.jpeg";

import { SlEnergy } from "react-icons/sl";
import { GiMinerals } from "react-icons/gi";
import { GiMiner } from "react-icons/gi";
import { RiArrowGoBackFill } from "react-icons/ri";

const RECURSOS = {
    bajo: { minerales: 100, energia: 50, cristales: 20 },
    normal: { minerales: 300, energia: 150, cristales: 50 },
    alto: { minerales: 500, energia: 250, cristales: 100 },
};

export default function CrearPartida() {
    const navigate = useNavigate();
    const fxRef = useRef(null);

    const [nombre, setNombre] = useState("");
    const [galaxia, setGalaxia] = useState("Nebulosa Orion");
    const [maxJugadores, setMaxJugadores] = useState(2);
    const [tiempoMax, setTiempoMax] = useState(300);
    const [tiempoEspera, setTiempoEspera] = useState(60);
    const [nivelRecursos, setNivelRecursos] = useState("normal");

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
                alto: { minerales: 500, energia: 250, cristales: 100 },
            }[nivelRecursos],
        };

        socket.emit("create_game", config);

        socket.once("partida_creada", (partida) => {
            alert("Partida creada: " + partida.id);
            navigate("/unirse", { state: { partidaId: partida.id } });
        });
    };

    const res = RECURSOS[nivelRecursos];

    return (
        <div
            className="crear-page"
            style={{ backgroundImage: `url(${backgroundLogin})` }}
        >
            <div className="crear-bg-fx" ref={fxRef}></div>

            <div className="crear-overlay">
                <div className="crear-card">
                    <div className="crear-header">
                        <span className="crear-eyebrow">
                            ◆ Colonias Galácticas ◆
                        </span>
                        <h1 className="crear-title">Nueva Partida</h1>
                    </div>

                    <div className="crear-cols">

                        {/* Parte izquierda */}
                        <div className="crear-col">
                            <p className="crear-section-label">
                                Identificación
                            </p>
                            <div className="crear-form-group">
                                <label htmlFor="nombre">
                                    Nombre de la partida
                                </label>
                                <input
                                    id="nombre"
                                    type="text"
                                    placeholder="Ej: Batalla de Andrómeda"
                                    className="crear-field"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                />
                            </div>

                            <p
                                className="crear-section-label"
                                style={{ marginTop: "0.5rem" }}
                            >
                                Configuración espacial
                            </p>
                            <div className="crear-form-group">
                                <label htmlFor="galaxia">Galaxia</label>
                                <select
                                    id="galaxia"
                                    className="crear-field"
                                    value={galaxia}
                                    onChange={(e) => setGalaxia(e.target.value)}
                                >
                                    <option value="Nebulosa Orion">
                                        Nebulosa Orion
                                    </option>
                                </select>
                            </div>
                            <div className="crear-form-group">
                                <label htmlFor="maxJugadores">
                                    Máx. jugadores
                                </label>
                                <input
                                    id="maxJugadores"
                                    type="number"
                                    className="crear-field"
                                    value={maxJugadores}
                                    onChange={(e) =>
                                        setMaxJugadores(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <div className="crear-col-divider" />

                        {/* Parte central */}
                        <div className="crear-col">
                            <p className="crear-section-label">
                                Parámetros de combate
                            </p>
                            <div className="crear-form-group">
                                <label htmlFor="tiempoMax">
                                    Tiempo máximo (seg)
                                </label>
                                <input
                                    id="tiempoMax"
                                    type="number"
                                    className="crear-field"
                                    value={tiempoMax}
                                    onChange={(e) =>
                                        setTiempoMax(e.target.value)
                                    }
                                />
                            </div>
                            <div className="crear-form-group">
                                <label htmlFor="tiempoEspera">
                                    Tiempo de espera (seg)
                                </label>
                                <input
                                    id="tiempoEspera"
                                    type="number"
                                    className="crear-field"
                                    value={tiempoEspera}
                                    onChange={(e) =>
                                        setTiempoEspera(e.target.value)
                                    }
                                />
                            </div>
                            <div
                                className="crear-form-group"
                                style={{ marginTop: "0.2rem" }}
                            >
                                <label htmlFor="nivelRecursos">
                                    Nivel de recursos
                                </label>
                                <select
                                    id="nivelRecursos"
                                    className="crear-field"
                                    value={nivelRecursos}
                                    onChange={(e) =>
                                        setNivelRecursos(e.target.value)
                                    }
                                >
                                    <option value="bajo">Bajo</option>
                                    <option value="normal">Normal</option>
                                    <option value="alto">Alto</option>
                                </select>
                            </div>
                        </div>

                        <div className="crear-col-divider" />

                        {/* Parte derecha */}
                        <div className="crear-col crear-col-right">
                            <div>
                                <p className="crear-section-label">
                                    Dotación inicial
                                </p>
                                <div className="crear-resource-preview">
                                    <p className="crear-resource-title">
                                        Recursos asignados
                                    </p>
                                    <div className="crear-resource-row">
                                        <span>
                                            {" "}
                                            <GiMiner /> Minerales
                                        </span>
                                        <span>{res.minerales}</span>
                                    </div>
                                    <div className="crear-resource-row">
                                        <span>
                                            {" "}
                                            <SlEnergy /> Energía
                                        </span>
                                        <span>{res.energia}</span>
                                    </div>
                                    <div className="crear-resource-row">
                                        <span>
                                            <GiMinerals /> Cristales
                                        </span>
                                        <span>{res.cristales}</span>
                                    </div>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.5rem",
                                    marginTop: "auto",
                                }}
                            >
                                <button
                                    className="crear-btn-primary"
                                    onClick={crear}
                                >
                                    Crear Partida
                                </button>
                                <button
                                    className="crear-btn-back"
                                    onClick={() => navigate("/")}
                                >
                                    <RiArrowGoBackFill className="back-icon" />{" "}
                                    Volver al inicio
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
