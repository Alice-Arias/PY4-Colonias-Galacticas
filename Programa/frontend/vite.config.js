import { defineConfig } from 'vite';

/**
 * Configuración de Vite para el cliente.
 *
 * Nombre: vite.config.js
 * Entrada: ninguna
 * Salida: configuración del servidor de desarrollo
 * Restricciones: el backend debe estar ejecutándose en http://localhost:3000
 * Objetivo: servir el frontend en otro puerto y redirigir API + Socket.IO al backend
 */
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true
      },
      '/mapa': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/estado': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/universo': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/ranking': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/partidas': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/sistema': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
