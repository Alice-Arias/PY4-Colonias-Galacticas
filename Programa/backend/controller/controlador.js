const fs = require('fs');
const path = require('path');

/**
 * Controlador principal de rutas HTTP.
 *
 * Nombre: ControladorPrincipal
 * Entrada: instancia de Express y dependencias del dominio.
 * Salida: registra rutas sobre la app.
 * Restricciones: `universo` y `gestorPartidas` deben ser objetos válidos.
 * Objetivo: concentrar todas las rutas del servidor en una sola clase.
 */
class ControladorPrincipal {
    /**
     * Crea el controlador con sus dependencias.
     *
     * Nombre: constructor
     * Entrada: app (Express), universo, gestorPartidas, carpetaFrontend
     * Salida: instancia inicializada
     * Restricciones: las dependencias deben existir antes de registrar rutas
     * Objetivo: centralizar la configuración HTTP del servidor
     */
    constructor(app, { universo, gestorPartidas, carpetaFrontend }) {
        this.app = app;
        this.universo = universo;
        this.gestorPartidas = gestorPartidas;
        this.carpetaFrontend = carpetaFrontend;
    }

    /**
     * Registra todas las rutas públicas del backend.
     *
     * Nombre: registrar
     * Entrada: ninguna
     * Salida: ninguna
     * Restricciones: debe llamarse una sola vez al arrancar el servidor
     * Objetivo: dejar ordenado el registro de endpoints por responsabilidad
     */
    registrar() {
        this._registrarInicio();
        this._registrarMapa();
        this._registrarEstado();
        this._registrarAliases();
        this._registrarUniverso();
        this._registrarSistema();
        this._registrarRanking();
        this._registrarPartidas();
    }

    /**
     * Comprueba si el universo existe antes de responder.
     *
     * Nombre: _validarUniverso
     * Entrada: res (respuesta HTTP)
     * Salida: true si falta el universo, false si todo está bien
     * Restricciones: usa una respuesta 500 cuando el universo no está listo
     * Objetivo: evitar repetir la misma validación en muchas rutas
     */
    _validarUniverso(res) {
        if (!this.universo) {
            res.status(500).json({ error: 'Universo no inicializado' });
            return true;
        }

        return false;
    }

    /**
     * Construye un resumen simple del mapa para enviarlo por HTTP.
     *
     * Nombre: _crearResumenMapa
     * Entrada: ninguna
     * Salida: objeto con nombre, ciclo, tipos, rutas y sistemas
     * Restricciones: el universo debe existir antes de usarlo
     * Objetivo: evitar repetir la misma estructura en varias rutas
     */
    _crearResumenMapa() {
        return {
            nombre: this.universo.nombre,
            cicloProduccionSegundos: this.universo.cicloProduccionSegundos,
            tipos: this.universo.tipos,
            rutas: this.universo.rutas,
            sistemas: Array.from(this.universo.sistemas.values()).map((sistema) => ({
                id: sistema.id,
                nombre: sistema.nombre,
                descripcion: sistema.descripcion,
                tipo: sistema.tipo
            }))
        };
    }

    /**
     * Sirve el cliente o muestra un mensaje de estado.
     *
     * Nombre: _registrarInicio
     * Entrada: ninguna
     * Salida: ninguna
     * Restricciones: el archivo `frontend/index.html` debe existir para servir el cliente
     * Objetivo: mostrar la aplicación web desde la raíz del servidor
     */
    _registrarInicio() {
        this.app.get('/', (req, res) => {
            const rutaIndex = path.join(this.carpetaFrontend, 'index.html');

            if (fs.existsSync(rutaIndex)) {
                res.sendFile(rutaIndex);
                return;
            }

            res.send('Servidor de Colonias Galacticas activo');
        });
    }

    /**
     * Expone la definición base del mapa.
     *
     * Nombre: _registrarMapa
     * Entrada: ninguna
     * Salida: ninguna
     * Restricciones: `universo` debe estar inicializado
     * Objetivo: entregar al cliente la estructura del grafo sin perder claridad
     */
    _registrarMapa() {
        this.app.get('/mapa', (req, res) => {
            if (this._validarUniverso(res)) {
                return;
            }

            res.json(this._crearResumenMapa());
        });
    }

    /**
     * Devuelve el estado actual del universo.
     *
     * Nombre: _registrarEstado
     * Entrada: ninguna
     * Salida: ninguna
     * Restricciones: `universo` debe estar disponible en memoria
     * Objetivo: ofrecer al cliente el estado mutable de la partida
     */
    _registrarEstado() {
        this.app.get('/estado', (req, res) => {
            if (this._validarUniverso(res)) {
                return;
            }

            res.json(this.universo.convertirADTO());
        });
    }

    /**
     * Mantiene rutas antiguas como compatibilidad hacia atrás.
     *
     * Nombre: _registrarAliases
     * Entrada: ninguna
     * Salida: ninguna
     * Restricciones: las respuestas deben ser equivalentes a las rutas nuevas
     * Objetivo: evitar romper enlaces o clientes previos
     */
    _registrarAliases() {
        this.app.get('/galaxia', (req, res) => {
            if (this._validarUniverso(res)) {
                return;
            }

            res.json(this._crearResumenMapa());
        });

        this.app.get('/estado-partida-base', (req, res) => {
            if (this._validarUniverso(res)) {
                return;
            }

            res.json(this.universo.convertirADTO());
        });
    }

    /**
     * Expone el universo completo ya combinado.
     *
     * Nombre: _registrarUniverso
     * Entrada: ninguna
     * Salida: ninguna
     * Restricciones: `universo` debe estar listo
     * Objetivo: permitir al cliente cargar el mundo en una sola petición
     */
    _registrarUniverso() {
        this.app.get('/universo', (req, res) => {
            if (this._validarUniverso(res)) {
                return;
            }

            res.json(this.universo.convertirADTO());
        });
    }

    /**
     * Devuelve un sistema específico por identificador.
     *
     * Nombre: _registrarSistema
     * Entrada: ninguna
     * Salida: ninguna
     * Restricciones: el id debe existir dentro del universo
     * Objetivo: consultar detalles puntuales de un sistema
     */
    _registrarSistema() {
        this.app.get('/sistema/:id', (req, res) => {
            if (this._validarUniverso(res)) {
                return;
            }

            const sistema = this.universo.obtenerSistemaDTO(req.params.id);
            if (!sistema) return res.status(404).json({ error: 'Sistema no encontrado' });

            res.json(sistema);
        });
    }

    /**
     * Calcula y expone el ranking.
     *
     * Nombre: _registrarRanking
     * Entrada: ninguna
     * Salida: ninguna
     * Restricciones: el ranking depende de los propietarios existentes en memoria
     * Objetivo: mostrar al jugador la clasificación actual
     */
    _registrarRanking() {
        this.app.get('/ranking', (req, res) => {
            if (!this.universo) {
                res.json([]);
                return;
            }

            res.json(this.universo.obtenerRanking());
        });
    }

    /**
     * Crea, lista y une jugadores a partidas.
     *
     * Nombre: _registrarPartidas
     * Entrada: ninguna
     * Salida: ninguna
     * Restricciones: los datos se guardan solo en memoria
     * Objetivo: cubrir el flujo básico de crear/unirse a partida
     */
    _registrarPartidas() {
        this.app.get('/partidas', (req, res) => {
            res.json(this.gestorPartidas.listar());
        });

        this.app.post('/partidas', (req, res) => {
            const { nombre, jugador } = req.body || {};
            if (!nombre || !jugador) {
                return res.status(400).json({ error: 'Debes enviar nombre y jugador' });
            }

            const partida = this.gestorPartidas.crear(nombre, jugador);
            console.log(`Partida creada por ${jugador}: ${partida.id}`);
            res.status(201).json(partida);
        });

        this.app.post('/partidas/:id/unirse', (req, res) => {
            const { jugador } = req.body || {};
            if (!jugador) {
                return res.status(400).json({ error: 'Debes enviar el nombre del jugador' });
            }

            const partida = this.gestorPartidas.unirse(req.params.id, jugador);
            if (!partida) {
                return res.status(404).json({ error: 'Partida no encontrada' });
            }

            console.log(`Jugador ${jugador} se unio a la partida ${partida.id}`);
            res.json(partida);
        });
    }
}

module.exports = { ControladorPrincipal };
