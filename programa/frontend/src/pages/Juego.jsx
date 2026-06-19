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
import ModalEstadisticasPartida from "../components/modales/ModalEstadisticasPartida";
import { obtenerInfoTematica } from "../utils/tematicas";
import "../styles/Juego.css";

// ==============================================================================================
// NOMBRE: Juego
// ENTRADA: contexto de partida activa
// SALIDA: composición de paneles y modales de juego
// RESTRICCIONES: requiere estado generado por useJuego
// OBJETIVO: renderizar la pantalla principal de conquista
// ==============================================================================================
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
        sistemas,
        recursos,
        flotas,
        sistemasControlados,
        totalSistemas,
        porcentajeControl,
        puntajeJugador,
        posicionRanking,
        produccionTimer,
        temporizadorPartida,
        ganador,
        resumenPartida,
        tematica,
        alertaAtaque,
        setAlertaAtaque,
        inicioHabilitado,
        countdownInicioU,
        sistemaInicial,
        seleccionado,
        planetaSeleccionado,
        sistemaControlado,
        eventosVisibles,
        ultimoSync,
        movimientoVisual,
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
        enviarAtaque,
        playerSocketId,
    } = useJuego(partidaId, playerName);
    const tema = obtenerInfoTematica(tematica);

    const instalacionesActuales = useMemo(() => {
        const instalaciones = planetaSeleccionado?.instalaciones || {};

        return Object.entries(instalaciones)
            .filter(([, cantidad]) => Number(cantidad) > 0)
            .sort((a, b) => Number(b[1]) - Number(a[1]));
    }, [planetaSeleccionado]);

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
        <div className={`game-container ${tema.className}`}>
            <div className="game-shell">
                <ResourceBar
                    playerName={playerName}
                    minerales={recursos.minerales}
                    energia={recursos.energia}
                    cristales={recursos.cristales}
                    flotas={flotas}
                    sistemasControlados={sistemasControlados}
                    totalSistemas={totalSistemas}
                    porcentajeControl={porcentajeControl}
                    puntajeJugador={puntajeJugador}
                    posicionRanking={posicionRanking}
                    produccionTiempo={formatearTiempo(produccionTimer)}
                    partidaTiempo={formatearTiempo(temporizadorPartida)}
                    estado={estado}
                    ultimoSync={ultimoSync}
                    tematica={tematica}
                />

                <div className="game-main">
                    <div className="game-map-container">
                        <GalaxyMap
                            sistemas={sistemas}
                            selectedId={seleccionado?.id}
                            baseId={sistemaInicial?.id}
                            playerId={playerSocketId}
                            playerName={playerName}
                            movimientoVisual={movimientoVisual}
                            onPlanetSelect={handlePlanetSelect}
                        />

                        <div className="game-left-rail">
                            <section className="turn-flow-card">
                                <header className="turn-flow-header">
                                    <h3>Instalaciones</h3>
                                    <span>{planetaSeleccionado?.nombre || "Sin nodo"}</span>
                                </header>

                                <div className="instalaciones-panel-list">
                                    {!planetaSeleccionado && (
                                        <p className="instalaciones-empty">Selecciona un nodo para ver sus instalaciones.</p>
                                    )}

                                    {planetaSeleccionado && instalacionesActuales.length === 0 && (
                                        <p className="instalaciones-empty">Este nodo no tiene instalaciones construidas.</p>
                                    )}

                                    {instalacionesActuales.map(([tipo, cantidad]) => (
                                        <article key={tipo} className="instalacion-row">
                                            <span className="instalacion-tag">{tipo}</span>
                                            <strong className="instalacion-count">{cantidad}</strong>
                                        </article>
                                    ))}
                                </div>
                            </section>

                            <div className="game-events game-events-inline">
                                <EventLog eventos={eventosVisibles} title="Actividad reciente" compact />
                            </div>
                        </div>
                    </div>

                    <div className="game-right-panel">
                        <PlanetPanel
                            planeta={planetaSeleccionado}
                            esBaseInicial={Boolean(seleccionado && sistemaInicial && seleccionado.id === sistemaInicial.id)}
                            esPropio={Boolean(sistemaControlado && inicioHabilitado)}
                            onBuild={abrirConstruccion}
                            onSendFleet={abrirFlotas}
                            onDetails={abrirDetalles}
                            ultimoSync={ultimoSync}
                        />
                    </div>
                </div>
            </div>

            {!inicioHabilitado && (
                <div className="inicio-u-overlay">
                    <h3>Presiona U para iniciar</h3>
                    <p>Hasta iniciar, no se pueden construir acciones ni generar recursos.</p>
                    {countdownInicioU !== null && <strong>Arranque en {countdownInicioU}s</strong>}
                </div>
            )}

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
                onAtacar={enviarAtaque}
                onCerrar={() => setModalFlota(false)}
            />

            <ModalBatalla
                eventoBatalla={modalBatalla ? eventoBatalla : null}
                onCerrar={() => setModalBatalla(false)}
            />

            <ModalEstadisticasPartida
                resumenPartida={estado === "finalizada" ? resumenPartida : null}
                onCerrar={() => {}}
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
