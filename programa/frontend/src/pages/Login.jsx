// ==============================================================================================
// NOMBRE: Login
// ENTRADA: interacción del usuario en la pantalla inicial
// SALIDA: navegación hacia creación, unión o ranking
// RESTRICCIONES: conservar el flujo de entrada sin estado de partida
// OBJETIVO: mostrar la pantalla de acceso y navegación inicial
// ==============================================================================================
import "../styles/Login.css";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import backgroundLogin from "../assets/backgroundLogin.jpeg";

// ======================================================
// NOMBRE: Pantalla de Login
// ENTRADA: nombre escrito por el usuario
// SALIDA: navegación a crear/unirse/ranking
// RESTRICCIONES: nickname entre 4 y 20 caracteres
// OBJETIVO: capturar identidad del jugador para la sesión
// ======================================================
// ==============================================================================================
// NOMBRE: Login
// ENTRADA: interacción del usuario en pantalla de inicio
// SALIDA: navegación a vistas de juego disponibles
// RESTRICCIONES: no requiere sesión previa
// OBJETIVO: servir como puerta de entrada de la aplicación
// ==============================================================================================
function Login() {
    const referenciaEfecto = useRef(null);
    const navegar = useNavigate();

    const [apodoJugador, setApodoJugador] = useState("");

    useEffect(() => {
        const contenedorEfecto = referenciaEfecto.current;
        if (!contenedorEfecto) return;

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

            contenedorEfecto.appendChild(line);
        }
    }, []);

    // ======================================================
    // NOMBRE: validarNickname
    // ENTRADA: estado local apodoJugador
    // SALIDA: nickname limpio o null si no cumple
    // RESTRICCIONES: longitud mínima 4 y máxima 20
    // OBJETIVO: garantizar datos válidos antes de navegar
    // ======================================================
    const validarNickname = () => {
        const nicknameLimpio = apodoJugador.trim();

        if (!nicknameLimpio) {
            alert("Ingrese un nickname");
            return null;
        }

        if (nicknameLimpio.length < 4) {
            alert("El nickname debe tener al menos 4 caracteres");
            return null;
        }

        if (nicknameLimpio.length > 20) {
            alert("El nickname no puede tener más de 20 caracteres");
            return null;
        }

        sessionStorage.setItem("nickname", nicknameLimpio);
        localStorage.setItem("nickname", nicknameLimpio);
        return nicknameLimpio;
    };

    const manejarEnter = (e) => {
        if (e.key === "Enter") {
            crearPartida();
        }
    };

    const crearPartida = () => {
        if (!validarNickname()) return;
        navegar("/crear");
    };

    const unirsePartida = () => {
        if (!validarNickname()) return;
        navegar("/unirse");
    };

    return (
        <div
            className="login"
            style={{ backgroundImage: `url(${backgroundLogin})` }}
        >
            <div className="login-bg-fx" ref={referenciaEfecto}></div>

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
                        value={apodoJugador}
                        onChange={(e) => setApodoJugador(e.target.value)}
                        onKeyDown={manejarEnter}
                        maxLength={20}
                    />

                    <button className="login-primary-btn" onClick={crearPartida}>
                        Crear partida
                    </button>

                    <div className="login-buttons">
                        <button onClick={unirsePartida}>
                            Unirse a partida
                        </button>

                        <button onClick={() => navegar("/ranking")}>
                            Ver rankings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
