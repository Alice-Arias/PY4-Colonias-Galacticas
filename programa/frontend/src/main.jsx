// ==============================================================================================
// NOMBRE: main.jsx
// ENTRADA: punto de arranque de la aplicación React
// SALIDA: árbol montado en el root del navegador
// RESTRICCIONES: mantener el render inicial simple y predecible
// OBJETIVO: arrancar la aplicación React y montar el router
// ==============================================================================================
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from "react-router-dom"
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
)