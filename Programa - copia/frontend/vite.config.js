// ==============================================================================================
// NOMBRE: vite.config.js
// ENTRADA: opciones de build y servidor de desarrollo
// SALIDA: configuración de Vite para el frontend
// RESTRICCIONES: conservar la base path y el flujo de desarrollo
// OBJETIVO: configurar el servidor y build de Vite
// ==============================================================================================
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: "/PY4-Colonias-Galacticas/"
})