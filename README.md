#  Proyecto Programado #4 — Colonias Galácticas

### Juego Multijugador de Estrategia y Conquista Espacial en Tiempo Real

Sistema desarrollado utilizando **Node.js**, **Express**, **Socket.IO** y **React + Vite**, permitiendo que múltiples jugadores exploren, expandan y conquisten sistemas planetarios dentro de una galaxia compartida.

---

#  Integrantes

| Nombre                  | Carné      |
| ----------------------- | ---------- |
| Alice Arias Salazar     | 2023104639 |
| Heldyis Agüero Espinoza | 2023296812 |
| Yeremi Calvo Porras     | 2023083332 |

---

#  Información Académica

| Campo    | Información               |
| -------- | ------------------------- |
| Curso    | Lenguajes de Programación |
| Grupo    | GR 60                     |
| Semestre | I Semestre 2026           |
| Proyecto | Proyecto Programado #4    |
| Estado   | Finalizado                |

---

#  Descripción

**Colonias Galácticas** es un juego de estrategia espacial multijugador donde los jugadores compiten por el control de sistemas planetarios dentro de una galaxia representada mediante un grafo.

Cada jugador administra recursos, construye infraestructura, moviliza flotas y conquista territorios enemigos para expandir su dominio galáctico.

La comunicación y sincronización entre jugadores se realiza en tiempo real mediante **WebSockets**.

---

#  Objetivo del Juego

* Explorar sistemas planetarios.
* Administrar recursos estratégicos.
* Construir infraestructura.
* Crear y movilizar flotas.
* Conquistar territorios enemigos.
* Expandir el imperio galáctico.
* Alcanzar las condiciones de victoria.

---

# Funcionalidades

## Gestión de Partidas

* Crear partidas personalizadas.
* Unirse a partidas existentes.
* Sala de espera para jugadores.
* Inicio sincronizado.
* Configuración de recursos iniciales.

## Universo Galáctico

* Galaxias cargadas desde archivos JSON.
* Sistemas planetarios conectados mediante rutas espaciales.
* Representación mediante grafos.
* Información detallada de cada sistema.

## Recursos

* Producción automática de minerales.
* Producción automática de energía.
* Producción automática de cristales.
* Recolección y administración de recursos.

## Construcción

* Minas.
* Centros de Investigación.
* Astilleros.
* Fortalezas.

## Flotas

* Creación de flotas.
* Movilización entre sistemas.
* Ataques a sistemas enemigos.

## Conquista

* Combates automáticos.
* Cambio de propietario de sistemas.
* Expansión territorial.
* Eliminación de jugadores.

## Ranking

* Historial de partidas.
* Registro de ganadores.
* Estadísticas finales.

---


#  Tecnologías Utilizadas

## Backend

* Node.js
* Express
* Socket.IO

## Frontend

* React
* Vite

## Persistencia

* Archivos JSON

## Comunicación

* REST API
* WebSockets

---

#  Características Técnicas

* Arquitectura Cliente - Servidor.
* Programación Orientada a Objetos.
* Comunicación en tiempo real.
* Manejo de concurrencia multiusuario.
* Representación de galaxias mediante grafos.
* Persistencia de información.
* Configuración mediante archivos JSON.

---

#  Interfaz Gráfica

La aplicación permite:

* Iniciar sesión mediante nickname.
* Crear partidas.
* Unirse a partidas.
* Visualizar el mapa galáctico.
* Administrar recursos.
* Construir infraestructura.
* Movilizar flotas.
* Observar eventos en tiempo real.
* Consultar rankings históricos.

---

#  Requisitos

* Node.js 18 o superior.
* npm.

---

#  Ejecución

## 1. Ejecutar el Backend

```bash
cd backend
npm start
```

## 2. Ejecutar el Frontend

Abrir una nueva terminal y ejecutar:

```bash
cd frontend
npm run dev
```

---

#  Condiciones de Victoria

La partida finaliza cuando ocurre alguna de las siguientes condiciones:

* Un jugador controla el porcentaje requerido de sistemas planetarios.
* Todos los jugadores excepto uno han sido eliminados.
* Se alcanza el tiempo máximo configurado para la partida.

---

#  Ranking

Por cada partida se almacena:

* Nombre del ganador.
* Cantidad de sistemas controlados.
* Recursos acumulados.
* Tiempo de juego.
* Galaxia utilizada.
* Identificador de partida.

---

#  Licencia

Proyecto desarrollado exclusivamente con fines académicos para el curso de **Lenguajes de Programación** del **Instituto Tecnológico de Costa Rica**.

**Colonias Galácticas © 2026**
