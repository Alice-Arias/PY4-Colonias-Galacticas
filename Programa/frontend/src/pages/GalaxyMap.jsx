import { useEffect, useState } from "react";
import socket from "../services/socket";

// ======================================================
// NOMBRE: GalaxyMap (Mapa visual de la galaxia)
// ENTRADA: eventos socket del servidor (galaxia y partida)
// SALIDA: render visual del mapa + sistema seleccionado
// RESTRICCIONES:
// - Requiere partida iniciada (game_started)
// - galaxia debe tener sistemas con coordenadas x/y
// - socket debe estar conectado al servidor
// OBJETIVO:
// Mostrar visualmente la galaxia y permitir seleccionar sistemas
// ======================================================
export default function GalaxyMap() {
    const [galaxia, setGalaxia] = useState(null);
    const [selected, setSelected] = useState(null);

    // ======================================================
    // NOMBRE: listeners de socket (inicio y actualización)
    // ENTRADA: eventos "game_started" y "galaxia_update"
    // SALIDA: actualización del estado galaxia en tiempo real
    // RESTRICCIONES:
    // - evitar duplicar listeners
    // - limpiar listeners al desmontar componente
    // OBJETIVO:
    // Mantener sincronizado el mapa con el servidor
    // ======================================================
    useEffect(() => {
        const handleStart = (data) => {
            setGalaxia(data.partida.galaxia);
        };

        const handleUpdate = (gal) => {
            setGalaxia(gal);
        };

        socket.on("game_started", handleStart);
        socket.on("galaxia_update", handleUpdate);

        return () => {
            socket.off("game_started", handleStart);
            socket.off("galaxia_update", handleUpdate);
        };
    }, []);

    // ======================================================
    // NOMBRE: seleccionar sistema
    // ENTRADA: objeto sistema clickeado
    // SALIDA: sistema seleccionado + evento al servidor
    // RESTRICCIONES:
    // - sistema debe existir dentro de galaxia
    // - socket debe estar conectado
    // OBJETIVO:
    // Permitir interacción del jugador con un sistema
    // ======================================================
    const seleccionarSistema = (sistema) => {
        setSelected(sistema);

        socket.emit("select_system", {
            sistemaId: sistema.id
        });
    };

    if (!galaxia) {
        return <p>Esperando inicio de partida 🚀</p>;
    }

    return (
        <div style={{ display: "flex", gap: "20px" }}>
            {/* ======================================================
            MAPA DE GALAXIA
            Muestra todos los sistemas como puntos en el espacio
        ====================================================== */}
            <div
                style={{
                    position: "relative",
                    width: "800px",
                    height: "500px",
                    background: "black",
                    border: "2px solid #444",
                    overflow: "hidden"
                }}
            >
                {galaxia.sistemas.map((sistema, i) => (
                    <div
                        key={sistema.id || i}
                        onClick={() => seleccionarSistema(sistema)}
                        style={{
                            position: "absolute",
                            left: `${sistema.x}px`,
                            top: `${sistema.y}px`,
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            background:
                                sistema.estado === "no_explorado"
                                    ? "gray"
                                    : sistema.estado === "controlado"
                                        ? "lime"
                                        : "red",
                            cursor: "pointer",
                            transform: "translate(-50%, -50%)",
                            boxShadow: "0 0 10px white"
                        }}
                        title={sistema.nombre}
                    />
                ))}
            </div>

            {/* ======================================================
            PANEL DE INFORMACIÓN DEL SISTEMA
            ====================================================== */}
            <div style={{ width: "300px", color: "white" }}>
                <h2>Sistema</h2>

                {selected ? (
                    <>
                        <p><b>Nombre:</b> {selected.nombre}</p>
                        <p><b>Estado:</b> {selected.estado}</p>

                        <h3>Recursos</h3>
                        <p>Minerales: {selected.recursos.minerales}</p>
                        <p>Energía: {selected.recursos.energia}</p>
                        <p>Cristales: {selected.recursos.cristales}</p>
                    </>
                ) : (
                    <p>Selecciona un sistema</p>
                )}
            </div>
        </div>
    );
}