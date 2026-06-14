import "../styles/Login.css";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import backgroundLogin from "../assets/backgroundLogin.jpeg";

function Login() {
    const fxRef = useRef(null);
    const navigate = useNavigate();

    const [nickname, setNickname] = useState("");

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

    const validarNickname = () => {
        const limpio = nickname.trim();

        if (!limpio) {
            alert("Ingrese un nickname");
            return null;
        }

        if (limpio.length < 4) {
            alert("El nickname debe tener al menos 4 caracteres");
            return null;
        }

        if (limpio.length > 20) {
            alert("El nickname no puede tener más de 20 caracteres");
            return null;
        }

        localStorage.setItem("nickname", limpio);
        return limpio;
    };

    const manejarEnter = (e) => {
        if (e.key === "Enter") {
            crearPartida();
        }
    };

    const crearPartida = () => {
        if (!validarNickname()) return;
        navigate("/crear");
    };

    const unirsePartida = () => {
        if (!validarNickname()) return;
        navigate("/unirse");
    };

    return (
        <div
            className="login"
            style={{ backgroundImage: `url(${backgroundLogin})` }}
        >
            <div className="login-bg-fx" ref={fxRef}></div>

            <div className="login-overlay">
                <div className="login-card">
                    <h1>Colonias Galácticas</h1>

                    <p className="login-subtitle">
                        Ingresa tu nombre para comenzar tu conquista espacial.
                    </p>

                    <input
                        type="text"
                        placeholder="Nombre de usuario"
                        className="login-input"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        onKeyDown={manejarEnter}
                        maxLength={20}
                    />

                    <button
                        className="login-primary-btn"
                        onClick={crearPartida}
                    >
                        Crear partida
                    </button>

                    <div className="login-buttons">
                        <button onClick={unirsePartida}>
                            Unirse a partida
                        </button>

                        <button onClick={() => navigate("/ranking")}>
                            Ver rankings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
