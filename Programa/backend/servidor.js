const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const { Universo, GestorPartidas } = require('./lib/universo');
const { ControladorPrincipal } = require('./controller/controlador');

/**
 * Lee un archivo JSON y lo convierte en objeto JavaScript.
 *
 * Nombre: cargarJson
 * Entrada: rutaArchivo (string)
 * Salida: objeto JavaScript con el contenido del archivo
 * Restricciones: la ruta debe existir y el JSON debe ser válido
 * Objetivo: cargar los datos del juego desde disco de forma simple
 */
function cargarJson(rutaArchivo) {
    const contenido = fs.readFileSync(rutaArchivo, 'utf8');// Lee el contenido del archivo como texto
    return JSON.parse(contenido);
}

/**
 * Crea la aplicación Express y el servidor HTTP.
 *
 * Nombre: crearServidorBase
 * Entrada: ninguna
 * Salida: objeto con app y servidorHttp
 * Restricciones: no depende de datos del juego
 * Objetivo: separar la base del servidor del resto de la lógica
 */
function crearServidorBase() {
    const app = express();
    const servidorHttp = http.createServer(app);// Crea un servidor HTTP usando la aplicación Express

    return { app, servidorHttp };
}

/**
 * Prepara la parte compartida del backend.
 *
 * Nombre: configurarServidor
 * Entrada: ninguna
 * Salida: objeto con app, servidorHttp, socketServidor y carpetaFrontend
 * Restricciones: el frontend debe existir en la ruta esperada
 * Objetivo: dejar listo Express, Socket.IO y los archivos estáticos
 */
function configurarServidor() {
    const { app, servidorHttp } = crearServidorBase();
    const carpetaFrontend = path.join(__dirname, '..', 'frontend');

    app.use(express.json());
    app.use(express.static(carpetaFrontend));

    const socketServidor = new Server(servidorHttp, {// Configuración de CORS para permitir conexiones desde el frontend
        cors: { origin: '*' }
    });

    return { app, servidorHttp, socketServidor, carpetaFrontend };
}

/**
 * Carga el mapa base y el estado inicial desde archivos JSON.
 *
 * Nombre: cargarDatosDelJuego
 * Entrada: ninguna
 * Salida: objeto con mapa y estadoBase
 * Restricciones: los archivos deben existir en backend/data
 * Objetivo: tener los datos del juego listos antes de crear el universo
 */
function cargarDatosDelJuego() {
    const rutaMapa = path.join(__dirname, 'data', 'mapa.json');
    const rutaEstado = path.join(__dirname, 'data', 'estado.json');

    const mapa = cargarJson(rutaMapa);
    const estadoBase = cargarJson(rutaEstado);

    console.log(`Mapa cargado: ${mapa.nombre} (${mapa.sistemas.length} sistemas, ${mapa.rutas.length} rutas)`);
    console.log(`Estado base cargado: ${estadoBase.sistemas.length} sistemas`);

    return { mapa, estadoBase };
}

/**
 * Crea las instancias principales del juego.
 *
 * Nombre: crearDominio
 * Entrada: mapa, estadoBase
 * Salida: objeto con universo y gestorPartidas
 * Restricciones: el mapa y el estado deben venir ya cargados
 * Objetivo: centralizar la creación de las clases del dominio
 */
function crearDominio(mapa, estadoBase) {
    const universo = new Universo(mapa, estadoBase);// Crea una instancia de Universo con el mapa y el estado inicial
    const gestorPartidas = new GestorPartidas();// Crea una instancia de GestorPartidas para manejar las partidas del juego

    return { universo, gestorPartidas };
}

/**
 * Registra las rutas HTTP del servidor.
 *
 * Nombre: registrarRutas
 * Entrada: app, universo, gestorPartidas, carpetaFrontend
 * Salida: ninguna
 * Restricciones: las dependencias deben estar creadas antes de llamar
 * Objetivo: dejar la configuración de rutas en un solo punto
 */
function registrarRutas(app, universo, gestorPartidas, carpetaFrontend) {
    const controlador = new ControladorPrincipal(app, {// Crea una instancia del controlador principal con las dependencias necesarias
        universo,
        gestorPartidas,
        carpetaFrontend
    });

    controlador.registrar();
}

/**
 * Registra los eventos de Socket.IO.
 *
 * Nombre: registrarSockets
 * Entrada: socketServidor, universo
 * Salida: ninguna
 * Restricciones: el universo debe existir antes de emitir eventos
 * Objetivo: enviar estado inicial y mensajes a cada cliente conectado
 */
function registrarSockets(socketServidor, universo) {
    socketServidor.on('connection', (socket) => {
        console.log('Informacion: Cliente conectado al servidor');

        socket.emit('mensaje', 'Bienvenido al servidor');
        socket.emit('universo', universo.convertirADTO());

        socket.on('chat', (mensaje) => {
            socketServidor.emit('chat', mensaje);
        });

        socket.on('disconnect', () => {
            console.log('Informacion: Cliente desconectado del servidor');
        });
    });
}

/**
 * Inicia el servidor HTTP.
 *
 * Nombre: iniciarServidor
 * Entrada: servidorHttp
 * Salida: ninguna
 * Restricciones: el puerto debe estar disponible o configurado en PORT
 * Objetivo: arrancar la aplicación para que el cliente pueda conectarse
 */
function iniciarServidor(servidorHttp) {
    const PORT = process.env.PORT || 3000;

    servidorHttp.listen(PORT, () => {
        console.log(`Servidor ejecutándose en puerto ${PORT}`);
    });

    servidorHttp.on('error', (error) => {
        if (error && error.code === 'EADDRINUSE') {
            console.error(`Error: puerto ${PORT} en uso. Use otra variable de entorno PORT o cierre el proceso que lo ocupa.`);
            return;
        }

        console.error('Error en el servidor HTTP:', error);
    });
}

/**
 * Arranque principal del backend.
 *
 * Nombre: iniciarAplicacion
 * Entrada: ninguna
 * Salida: ninguna
 * Restricciones: los archivos JSON y el frontend deben estar disponibles
 * Objetivo: ejecutar en orden la configuración, el dominio, las rutas y los sockets
 */
function iniciarAplicacion() {
    const { app, servidorHttp, socketServidor, carpetaFrontend } = configurarServidor();
    const { mapa, estadoBase } = cargarDatosDelJuego();
    const { universo, gestorPartidas } = crearDominio(mapa, estadoBase);

    universo.iniciar(socketServidor);
    registrarRutas(app, universo, gestorPartidas, carpetaFrontend);
    registrarSockets(socketServidor, universo);
    iniciarServidor(servidorHttp);
}

iniciarAplicacion();
