
# Colonias Galácticas — Proyecto Programado #4

<div align="center">

![Instituto](https://img.shields.io/badge/Instituto-Tec%20Costa%20Rica-blue)
![Curso](https://img.shields.io/badge/Curso-Lenguajes%20de%20Programaci%C3%B3n-lightgrey)
![Semestre](https://img.shields.io/badge/Semestre-I%20Semestre%202026-green)
![Estado](https://img.shields.io/badge/Estado-Draft-orange)

</div>

---

**Instituto:** Instituto Tecnológico de Costa Rica

**Carrera:** Ingeniería en Computación

**Curso:** Lenguajes de Programación (IC-4700)

**Profesor:** Allan Rodríguez Dávila

**Proyecto:** Proyecto Programado #4 — Colonias Galácticas

**Semestre:** I, 2026

---

## Introducción

Los juegos de estrategia y conquista espacial permiten explorar sistemas estelares, administrar recursos, expandir territorios y competir o colaborar en universos compartidos. En este proyecto el universo se representa como un grafo de sistemas planetarios y rutas espaciales. La galaxia se carga desde archivos persistentes (`.json`) y se transforma en estructuras internas que alimentan la lógica del servidor y la visualización en el frontend.

Cada sistema planetario dispone de nombre, descripción, producción periódica de recursos (minerales, energía, cristales), propietario, flotas estacionadas, instalaciones y estado de exploración.

---

## Objetivos

1. Practicar modelado de aplicaciones y decisiones de dominio.
2. Aplicar POO en el backend y separar responsabilidades cliente/servidor.
3. Implementar arquitecturas cliente-servidor y comunicación en tiempo real (WebSockets).
4. Usar frameworks modernos (Node.js/Express, React) y persistencia con una BD libre.
5. Fomentar trabajo colaborativo y control de versiones en GitHub.

---

## Requisitos

- Node.js 18+ y npm
- Backend: Node.js + Express
- Frontend: React (Vite) 
- Base de datos libre (SQLite, PostgreSQL, MongoDB, a elección)
- ngrok o localtunnel para publicación temporal

---

## Alcance funcional (resumen)

- Cliente: crear partida, unirse a partida, ver ranking.
- Autenticación: nickname (sin gestión de usuarios completa).
- Partida: configuración (nombre, galaxia, max jugadores, tiempo, recursos iniciales).
- Galaxias predefinidas: carga desde `.json`, mínimo 25 sistemas y 40 rutas.
- Juego en tiempo real: mapa galáctico, gestión de recursos, construcción, movilización de flotas y conquista.
- Sincronización: WebSockets para actualizar eventos en tiempo real.
- Finalización: condiciones configurables (porcentaje de control, tiempo, eliminación de jugadores).

---

## Formato de galaxia (ejemplo)

```json
{
	"nombre": "Nebulosa Orion",
	"sistemas": [
		{"id":"S1","nombre":"Terra","tipo":"balanceado"},
		{"id":"S2","nombre":"Nova","tipo":"minero"},
		{"id":"S3","nombre":"Atlas","tipo":"energetico"}
		// ... hasta 25 sistemas
	],
	"rutas": [
		["S1","S2"],["S2","S3"],["S3","S4"]
		// ... conexiones adicionales
	]
}
```

Tipos de sistema y producción (configurable por ciclo):

- Minero: minerales 100, energía 30, cristales 10
- Energético: minerales 50, energía 50, cristales 10
- Científico: minerales 40, energía 40, cristales 30
- Balanceado: minerales 35, energía 35, cristales 35

Se recomienda un ciclo de producción configurable (ej. 20 segundos).

---

## Mecánicas principales

- Recolección y acumulación de recursos.
- Construcción (Mina, Central de investigación, Astillero, Fortaleza) con costos definidos.
- Movilización de flotas entre sistemas conectados.
- Resolución automática de combates con reglas simples (flotas vs flotas, impacto en instalaciones).
- Visualización en tiempo real de movimientos, construcciones y cambios de propietario.

---

## Interfaz (cliente)

- Menú inicial: Crear partida / Unirse / Ver ranking.
- Sala de espera para jugadores antes de iniciar.
- Mapa interactivo (clic en sistema → ver detalles: nombre, propietario, recursos, flotas, infraestructuras).
- Panel de acciones para construir, mover flotas y recolectar recursos.

---

## API y comunicación


---

## Ejecución local (desarrollo)

1) Backend (Node.js + Express)

```bash
cd backend
npm install
npm start
```

2) Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

3) Publicación temporal 

```bash

```

---

## Persistencia y archivos de configuración

- Las galaxias y configuraciones deben almacenarse en `backend/data/` en formato JSON.
- Parámetros del servidor en `backend/config.json` (puerto, ciclo de producción, tiempo de espera para inicio de partida, etc.).
- Historial y estadísticas en la BD elegida o en archivos bajo `backend/storage/`.

---


## Licencia

Material desarrollado con fines académicos para IC-4700 — Lenguajes de Programación.

Colonias Galácticas © 2026

