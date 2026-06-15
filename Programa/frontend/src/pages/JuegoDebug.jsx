import { useEffect, useState } from "react";
import "../services/socket";
import "../styles/Juego.css";

/**
 * Versión simplificada de DEBUG del juego
 * para verificar que los elementos aparecen
 */
export default function JuegoDebug() {
    const [estado, setEstado] = useState("conectando");
    const [contador, setContador] = useState(2);

    useEffect(() => {
        const interval = setInterval(() => {
            setContador(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setEstado("activo");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    if (estado === "conectando") {
        return (
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                background: "linear-gradient(135deg, #0a0f1a 0%, #1a2849 100%)",
                color: "#00ff88",
                fontSize: "24px",
                fontWeight: "bold"
            }}>
                <div style={{ textAlign: "center" }}>
                    <h1>Conectando...</h1>
                    <p>Comenzará en: {contador}s</p>
                    <div style={{
                        width: "50px",
                        height: "50px",
                        border: "4px solid #00ff88",
                        borderTop: "4px solid transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        margin: "20px auto"
                    }}></div>
                    <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            background: "linear-gradient(135deg, #0a0f1a 0%, #1a2849 100%)",
            color: "#fff",
            fontFamily: "Arial",
            padding: "20px",
            gap: "20px",
            overflow: "auto"
        }}>
            <div style={{
                background: "linear-gradient(135deg, #0a1628 0%, #1a2849 100%)",
                border: "2px solid #00ff88",
                padding: "20px",
                borderRadius: "10px",
                textAlign: "center"
            }}>
                <h1 style={{ margin: "0", color: "#00ff88" }}>✅ JUEGO ACTIVO</h1>
                <p style={{ margin: "10px 0 0 0", fontSize: "14px" }}>Si ves esto, la interfaz funciona correctamente</p>
            </div>

            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
                flex: 1
            }}>
                {/* Panel izquierdo */}
                <div style={{
                    background: "linear-gradient(135deg, #0a1628 0%, #1a2849 100%)",
                    border: "1px solid #00ff88",
                    padding: "20px",
                    borderRadius: "10px",
                    overflow: "auto"
                }}>
                    <h2 style={{ color: "#00ff88", margin: "0 0 15px 0" }}>MAPA GALÁCTICO</h2>
                    <div style={{
                        background: "rgba(0, 255, 136, 0.05)",
                        padding: "40px",
                        textAlign: "center",
                        color: "#888",
                        minHeight: "300px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "5px"
                    }}>
                        <p>Sistemas planetarios aquí</p>
                    </div>
                </div>

                {/* Panel derecho */}
                <div style={{
                    background: "linear-gradient(135deg, #0a1628 0%, #1a2849 100%)",
                    border: "1px solid #00ff88",
                    padding: "20px",
                    borderRadius: "10px",
                    overflow: "auto"
                }}>
                    <h2 style={{ color: "#00ff88", margin: "0 0 15px 0" }}>INFORMACIÓN DEL PLANETA</h2>
                    <div style={{
                        background: "rgba(0, 255, 136, 0.05)",
                        padding: "20px",
                        borderRadius: "5px",
                        borderLeft: "3px solid #00ff88",
                        marginBottom: "15px"
                    }}>
                        <p style={{ margin: "0 0 10px 0", color: "#aaa" }}>Selecciona un planeta</p>
                        <p style={{ margin: "0", color: "#666", fontSize: "12px", fontStyle: "italic" }}>Haz clic en un sistema en el mapa</p>
                    </div>
                </div>
            </div>

            {/* Panel de eventos */}
            <div style={{
                background: "linear-gradient(135deg, #0a1628 0%, #1a2849 100%)",
                border: "1px solid #00ff88",
                padding: "20px",
                borderRadius: "10px",
                maxHeight: "200px",
                overflow: "auto"
            }}>
                <h3 style={{ color: "#00ff88", margin: "0 0 10px 0" }}>EVENTOS</h3>
                <div style={{ fontSize: "12px", color: "#ccc" }}>
                    <p style={{ margin: "5px 0", color: "#00ff88" }}>10:23 <span style={{ color: "#888" }}>Ali</span>: conquistó Vega</p>
                    <p style={{ margin: "5px 0", color: "#ff4444" }}>10:24 <span style={{ color: "#888" }}>Pedro</span>: construyó Fortaleza</p>
                    <p style={{ margin: "5px 0", color: "#00aaff" }}>10:25 <span style={{ color: "#888" }}>Terra</span>: Flota enviada</p>
                </div>
            </div>
        </div>
    );
}
