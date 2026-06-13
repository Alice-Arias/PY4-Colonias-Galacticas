import "../styles/Login.css";
import { useEffect, useRef } from "react";
import backgroundLogin from "../assets/backgroundLogin.jpeg";

function Login() {
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

    return (
        <div
            className="login"
            style={{ backgroundImage: `url(${backgroundLogin})` }}
        >
            <div className="login-bg-fx" />
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
                    />
                    <button className="login-primary-btn">Crear partida</button>
                    <div className="login-buttons">
                        <button>Unirse a partida</button>
                        <button>Ver rankings</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
