// Cliente del juego Colonias Galácticas.
// Este archivo conecta la interfaz HTML con el backend usando Fetch y Socket.IO.

/**
 * Objeto de conexión Socket.IO.
 *
 * Nombre: conexionSocket
 * Entrada: ninguna
 * Salida: instancia conectada al servidor
 * Restricciones: el servidor debe estar en ejecución y servir /socket.io/socket.io.js
 * Objetivo: recibir eventos en tiempo real y enviar mensajes simples al servidor
 */
const conexionSocket = io();

/**
 * Obtiene un elemento del DOM por su id.
 *
 * Nombre: obtenerElemento
 * Entrada: idElemento (string)
 * Salida: elemento HTML o null
 * Restricciones: el id debe existir en la página
 * Objetivo: evitar repetir document.getElementById en todo el archivo
 */
function obtenerElemento(idElemento) {
    return document.getElementById(idElemento);
}

/**
 * Muestra un texto en el registro de eventos.
 *
 * Nombre: registrarMensaje
 * Entrada: textoMensaje (string)
 * Salida: ninguna
 * Restricciones: debe existir el contenedor con id log
 * Objetivo: centralizar los mensajes visibles para el jugador
 */
function registrarMensaje(textoMensaje) {
    const contenedorRegistro = obtenerElemento('log');
    if (!contenedorRegistro) {
        return;
    }

    const elementoMensaje = document.createElement('div');
    elementoMensaje.textContent = `[${new Date().toLocaleTimeString()}] ${textoMensaje}`;
    contenedorRegistro.prepend(elementoMensaje);
}

/**
 * Hace una petición HTTP que devuelve JSON.
 *
 * Nombre: pedirJson
 * Entrada: ruta (string), opciones (objeto opcional)
 * Salida: respuesta JSON o lanza error
 * Restricciones: el servidor debe responder con JSON válido
 * Objetivo: simplificar los fetch repetidos
 */
async function pedirJson(ruta, opciones = {}) {
    const respuesta = await fetch(ruta, opciones);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(datos.error || 'Error en la petición');
    }

    return datos;
}

/**
 * Escribe un mensaje en el panel de eventos.
 *
 * Nombre: escribirRegistro
 * Entrada: textoMensaje (string)
 * Salida: ninguna
 * Restricciones: debe existir el contenedor HTML con id `log`
 * Objetivo: mostrar acciones y respuestas importantes al jugador
 */
function escribirRegistro(textoMensaje) {
    registrarMensaje(textoMensaje);
}

/**
 * Registra los eventos principales del Socket.IO.
 *
 * Nombre: registrarEventosSocket
 * Entrada: ninguna
 * Salida: ninguna
 * Restricciones: `conexionSocket` debe estar inicializado
 * Objetivo: escuchar mensajes del servidor y refrescar el universo cuando cambie
 */
function registrarEventosSocket() {
    conexionSocket.on('connect', () => registrarMensaje('Conectado al servidor'));
    conexionSocket.on('disconnect', () => registrarMensaje('Desconectado del servidor'));
    conexionSocket.on('mensaje', (mensajeServidor) => registrarMensaje('Servidor: ' + mensajeServidor));
    conexionSocket.on('produccion', () => registrarMensaje('Evento de producción recibido'));
    conexionSocket.on('universo', (universoActual) => {
        registrarMensaje('Universo actualizado');
        renderizarUniverso(universoActual);
    });
}

/**
 * Crear una partida desde el formulario.
 *
 * Nombre: crearPartida
 * Entrada: ninguna, lee valores desde el DOM
 * Salida: ninguna
 * Restricciones: debe existir el endpoint POST /partidas
 * Objetivo: permitir al jugador crear una nueva partida
 */
async function crearPartida() {
    const campoNombrePartida = obtenerElemento('crear-nombre');
    const campoNombreJugador = obtenerElemento('crear-jugador');
    const contenedorRespuesta = obtenerElemento('crear-respuesta');

    const nombrePartida = campoNombrePartida.value || 'Partida';
    const nombreJugador = campoNombreJugador.value || 'Jugador';

    try {
        const datos = await pedirJson('/partidas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: nombrePartida, jugador: nombreJugador })
        });

        contenedorRespuesta.textContent = `Partida creada: ${datos.id}`;
        registrarMensaje('Partida creada: ' + datos.id);
    } catch (error) {
        contenedorRespuesta.textContent = 'Error: ' + error.message;
        registrarMensaje('Error al crear partida: ' + error.message);
    }
}

/**
 * Unirse a una partida existente.
 *
 * Nombre: unirseAPartida
 * Entrada: ninguna, lee valores desde el DOM
 * Salida: ninguna
 * Restricciones: el usuario debe escribir un ID válido de partida
 * Objetivo: permitir al jugador entrar a una partida ya creada
 */
async function unirseAPartida() {
    const campoIdPartida = obtenerElemento('unirse-id');
    const campoNombreJugador = obtenerElemento('unirse-jugador');
    const contenedorRespuesta = obtenerElemento('unirse-respuesta');
    // Lee el ID de la partida y el nombre del jugador desde los campos del formulario
    const idPartida = campoIdPartida.value;
    const nombreJugador = campoNombreJugador.value || 'Jugador';

    if (!idPartida) {// Validación simple para evitar enviar una petición sin ID
        contenedorRespuesta.textContent = 'Introduce un ID';
        return;
    }

    try {
        const datos = await pedirJson(`/partidas/${encodeURIComponent(idPartida)}/unirse`, {// Envía el nombre del jugador para unirse a la partida específica
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jugador: nombreJugador })
        });

        contenedorRespuesta.textContent = `Te uniste a: ${datos.id}`;
        registrarMensaje('Unido a partida: ' + datos.id);
    } catch (error) {
        contenedorRespuesta.textContent = 'Error: ' + error.message;
        registrarMensaje('Error al unirse: ' + error.message);
    }
}

/**
 * Cargar y pintar el ranking.
 *
 * Nombre: cargarRanking
 * Entrada: ninguna
 * Salida: ninguna
 * Restricciones: debe existir el endpoint GET /ranking
 * Objetivo: mostrar la tabla de posiciones de la partida
 */
async function cargarRanking() {// Hace una petición para obtener el ranking actual y lo muestra en la interfaz
    try {
        const ranking = await pedirJson('/ranking');
        const listaRanking = obtenerElemento('ranking-list');

        listaRanking.innerHTML = '';

        ranking.forEach((entradaRanking) => {
            listaRanking.appendChild(crearElementoRanking(entradaRanking));
        });

        registrarMensaje('Ranking actualizado');
    } catch (error) {
        registrarMensaje('Error al obtener ranking: ' + error.message);
    }
}

/**
 * Crea un elemento de lista para el ranking.
 *
 * Nombre: crearElementoRanking
 * Entrada: entradaRanking (objeto)
 * Salida: <li> con el texto del ranking
 * Restricciones: la entrada debe tener jugador, puntos y sistemasControlados
 * Objetivo: separar el formato visual del resto de la lógica
 */
function crearElementoRanking(entradaRanking) {
    const elementoLista = document.createElement('li');
    elementoLista.textContent = `${entradaRanking.jugador}: ${entradaRanking.puntos} pts (${entradaRanking.sistemasControlados} sistemas)`;// Crea un elemento de lista con el formato "Jugador: X pts (Y sistemas)"
    return elementoLista;
}

/**
 * Obtener el universo por HTTP.
 *
 * Nombre: obtenerUniverso
 * Entrada: ninguna
 * Salida: ninguna
 * Restricciones: debe existir el endpoint GET /universo
 * Objetivo: cargar el universo completo al iniciar o bajo demanda
 */
async function obtenerUniverso() {
    try {
        const universo = await pedirJson('/universo');
        renderizarUniverso(universo);
        registrarMensaje('Universo cargado por petición HTTP');
    } catch (error) {
        registrarMensaje('Error al cargar universo: ' + error.message);
    }
}

/**
 * Renderizar el universo en la interfaz.
 *
 * Nombre: renderizarUniverso
 * Entrada: universo (objeto con nombre, cicloProduccionSegundos, sistemas y rutas)
 * Salida: ninguna
 * Restricciones: debe existir el contenedor HTML con id `universo`
 * Objetivo: mostrar los sistemas del universo en una tabla clara
 */
function renderizarUniverso(universo) {
    const contenedorUniverso = obtenerElemento('universo');
    contenedorUniverso.innerHTML = '';

    if (!universo) {// Validación simple para evitar errores si el universo no se carga correctamente
        contenedorUniverso.textContent = 'No se pudo cargar el universo';
        return;
    }

    const encabezadoUniverso = document.createElement('h3');
    encabezadoUniverso.textContent = `${universo.nombre} (ciclo ${universo.cicloProduccionSegundos}s)`;// Crea un encabezado con el nombre del universo y el ciclo de producción
    contenedorUniverso.appendChild(encabezadoUniverso);

    const tablaSistemas = document.createElement('table');
    tablaSistemas.className = 'tabla-sistemas';

    const encabezadoTabla = document.createElement('thead');
    encabezadoTabla.innerHTML = '<tr><th>ID</th><th>Nombre</th><th>Tipo</th><th>Propietario</th><th>Minerales</th><th>Energía</th><th>Cristales</th></tr>';
    tablaSistemas.appendChild(encabezadoTabla);

    const cuerpoTabla = document.createElement('tbody');

    for (const sistema of universo.sistemas || []) {
        cuerpoTabla.appendChild(crearFilaSistema(sistema));// Crea una fila para cada sistema del universo usando la función crearFilaSistema
    }

    tablaSistemas.appendChild(cuerpoTabla);
    contenedorUniverso.appendChild(tablaSistemas);
}

/**
 * Crea una fila de tabla para un sistema.
 *
 * Nombre: crearFilaSistema
 * Entrada: sistema (objeto)
 * Salida: <tr> con los datos del sistema
 * Restricciones: el sistema debe traer sus campos principales
 * Objetivo: simplificar el render del universo
 */
function crearFilaSistema(sistema) {
    const filaSistema = document.createElement('tr');
    filaSistema.innerHTML = `<td>${sistema.id}</td><td>${sistema.nombre}</td><td>${sistema.tipo}</td><td>${sistema.propietario || '-'}</td><td>${sistema.recursos?.minerales || 0}</td><td>${sistema.recursos?.energia || 0}</td><td>${sistema.recursos?.cristales || 0}</td>`;
    return filaSistema;
}

/**
 * Inicializar la interfaz del cliente.
 *
 * Nombre: inicializarCliente
 * Entrada: ninguna
 * Salida: ninguna
 * Restricciones: el DOM debe estar cargado
 * Objetivo: conectar eventos de botones, sockets y carga inicial del universo
 */
function inicializarCliente() {
    // Registra los eventos de Socket.IO para recibir mensajes y actualizaciones del servidor
    registrarEventosSocket();
    // Conecta los botones del formulario a sus funciones correspondientes
    obtenerElemento('btn-crear').addEventListener('click', crearPartida);
    obtenerElemento('btn-unirse').addEventListener('click', unirseAPartida);
    obtenerElemento('btn-ranking').addEventListener('click', cargarRanking);
    obtenerElemento('btn-universo').addEventListener('click', obtenerUniverso);
    // Carga el universo al iniciar para mostrar algo en pantalla
    obtenerUniverso();
}

// Arranque cuando el DOM ya está listo.
document.addEventListener('DOMContentLoaded', inicializarCliente);
