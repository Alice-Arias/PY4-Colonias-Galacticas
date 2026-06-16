// ======================================================
// NOMBRE: Juego
// ENTRADA: partidaId desde location.state o sessionStorage
// SALIDA: interfaz completa del juego en tiempo real
// RESTRICCIONES: requiere partidaId válido y conexión al servidor
// OBJETIVO: ensamblar todos los componentes y hooks del juego
// ======================================================

import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useJuego } from "../hooks/useJuego";
import { formatearTiempo } from "../utils/transformadores";
import ResourceBar from "../components/ResourceBar";
import GalaxyMap from "../components/GalaxyMap";
import PlanetPanel from "../components/PlanetPanel";
import EventLog from "../components/EventLog";
import ModalDetalles from "../components/modales/ModalDetalles";
import ModalConstruir from "../components/modales/ModalConstruir";
import ModalFlota from "../components/modales/ModalFlota";
import ModalBatalla from "../components/modales/ModalBatalla";
import "../styles/Juego.css";

export default function Juego() {
    const playerName = sessionStorage.getItem("nickname") || localStorage.getItem("nickname") || "Jugador";
    const location = useLocation();
    const partidaId = useMemo(
        () => location.state?.partidaId || sessionStorage.getItem("partidaId") || localStorage.getItem("partidaId") || "",
        [location.state]
    );

    const {
        // Estado
        estado,
        mensajeInicio,
        countdown,
        sistemas,
        recursos,
        flotas,
        produccionTimer,
        temporizadorPartida,
        ganador,
        alertaAtaque,
        setAlertaAtaque,
        inicioHabilitado,
        countdownInicioU,
        sistemaInicial,
        seleccionado,
        planetaSeleccionado,
        sistemaControlado,
        eventosVisibles,
        // Modales
        modalConstruir,
        modalFlota,
        modalDetalles,
        modalBatalla,
        eventoBatalla,
        setModalConstruir,
        setModalFlota,
        setModalDetalles,
        setModalBatalla,
        // Formularios
        formConstruccion,
        setFormConstruccion,
        formFlota,
        setFormFlota,
        // Acciones
        handlePlanetSelect,
        abrirDetalles,
        abrirConstruccion,
        abrirFlotas,
        enviarConstruccion,
        enviarFlotas,
    } = useJuego(partidaId, playerName);

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

            <ModalDetalles
                planeta={modalDetalles ? planetaSeleccionado : null}
                onCerrar={() => setModalDetalles(false)}
            />

            <ModalConstruir
                sistema={modalConstruir ? seleccionado : null}
                recursos={recursos}
                tipoSeleccionado={formConstruccion}
                onChangeTipo={setFormConstruccion}
                onConstruir={enviarConstruccion}
                onCerrar={() => setModalConstruir(false)}
            />

            <ModalFlota
                sistemaOrigen={modalFlota ? seleccionado : null}
                sistemas={sistemas}
                formFlota={formFlota}
                onChangeDestino={(destino) => setFormFlota((prev) => ({ ...prev, destino }))}
                onChangeCantidad={(cantidad) => setFormFlota((prev) => ({ ...prev, cantidad }))}
                onEnviar={enviarFlotas}
                onCerrar={() => setModalFlota(false)}
            />

            <ModalBatalla
                eventoBatalla={modalBatalla ? eventoBatalla : null}
                onCerrar={() => setModalBatalla(false)}
            />

            {ganador && (
                <div className="game-over-banner">
                    <h2>Ganador: {ganador}</h2>
                </div>
            )}

            {alertaAtaque && (
                <div className="game-alert-banner" onClick={() => setAlertaAtaque("")}>
                    {alertaAtaque}
                </div>
            )}
        </div>
    );
}
