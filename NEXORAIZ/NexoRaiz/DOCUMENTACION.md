# 📘 Documentación técnica — NEXORAIZ

## 1. Resumen

NEXORAIZ es una aplicación web full-stack para el Hackatón Nicaragua. Este documento explica qué había en el proyecto original que subiste, qué se cambió, cómo está construido ahora, y cómo seguir desarrollándolo.

---

## 2. Qué encontré en tu proyecto original (`NEXORAIZ-v_2--master.zip`)

- Dos carpetas, **`NEXORAIZ -Frontend`** y **`NEXORAIZ -Backent`**, con contenido casi idéntico: HTML + CSS + JavaScript **estático**, sin ningún servidor real. Es decir, no existía un backend funcional (no había API, ni base de datos, ni autenticación) — ambas carpetas eran, en la práctica, dos versiones del mismo frontend.
- Un único archivo `index.html` con 4 módulos manejados por JavaScript (mostrar/ocultar `div`s): **Inicio**, **Turismo** (mapa Leaflet + 17 departamentos), **Idiomas** (juego de preguntas Mayagna/Miskito) y **Leyendas** (2 historias: La Cegua y La Carreta Nagua).
- Los datos vivían "quemados" en `data/contenido.js`.
- El diseño era funcional pero genérico (fondo gris, sin identidad visual, sin modo oscuro, sin páginas de acceso).
- Se referenciaban archivos de audio/video (`audio/`, `videos/`) que **no estaban incluidos** en el proyecto.
- El README solo mencionaba a los autores y las tecnologías, sin instrucciones de instalación ni documentación de la API (porque no existía una).

Las 4 imágenes que enviaste (mockups de Login/Registro, un wireframe de otro proyecto llamado "DignaLearn" a modo de referencia de estilo, pantallas de Turismo/Idiomas/Leyendas, y el logo oficial) fueron la guía visual para el rediseño.

---

## 3. Qué construí (resumen de cambios)

### 3.1 Backend — de "no existía" a una API REST real
Construí un **backend real en Node.js puro** (sin librerías externas, ver nota en la sección 6) en `backend/server.js`:

- Sirve el frontend estático (`/frontend`).
- Expone una **API REST** bajo `/api` (detalle completo en la sección 4).
- **Autenticación real**: registro e inicio de sesión con contraseñas *hasheadas* (nunca en texto plano) usando `crypto.scrypt`, y sesiones con tokens firmados (HMAC-SHA256, estilo JWT).
- **Persistencia**: los usuarios y su progreso se guardan en archivos JSON (`backend/data/usuarios.json` y `progreso.json`). Es una solución suficiente para el hackatón; en la sección 7 explico cómo migrar a una base de datos real.
- El contenido (turismo, idiomas, leyendas) se centralizó en `backend/data/contenido.json` y ahora se sirve vía API en lugar de estar incrustado en el frontend.

### 3.2 Frontend — rediseño completo siguiendo tus referencias
- **Nueva identidad visual** basada en los colores de tu logo (verde bosque, verde lima, naranja, café, azul) — ver `frontend/css/variables.css`.
- **Modo claro / oscuro** con un interruptor 🌙/☀️ presente en todas las pantallas, que recuerda la preferencia del usuario (`localStorage`).
- **4 páginas nuevas**, en vez de una sola:
  - `index.html` — landing pública con hero a pantalla completa (inspirado en la fotografía editorial de *japan.travel*) y secciones de features/destinos.
  - `login.html` — pantalla de inicio de sesión, réplica fiel del mockup que enviaste (panel izquierdo con foto + panel derecho con formulario).
  - `registro.html` — registro **multi-paso** (datos personales → intereses → confirmación), igual que en tu mockup.
  - `app.html` — la aplicación real una vez autenticado, con sidebar y navbar (inspirada en el mockup de Turismo/Idiomas/Leyendas), y los 3 módulos originales pero conectados a la API.
- Los tres módulos (Turismo, Idiomas, Leyendas) ahora **consumen la API del backend** en vez de datos estáticos, y el progreso del juego de idiomas **se guarda por usuario** en el servidor.
- Turismo ahora incluye: buscador, filtros por categoría, lista de tarjetas además del mapa, y botón de favoritos (guardado local).
- Añadí 3 leyendas más (El Cadejo, La Mocuana, El Padre sin Cabeza) para enriquecer el catálogo, ya que aparecían mencionadas en tu wireframe de referencia.

### 3.3 Otros arreglos
- Corregí un archivo de imagen (`estelí.jpg`) que tenía el nombre corrupto (`estel#U00ed.jpg`) dentro del zip original — esto rompía la carga de esa imagen.
- Eliminé la duplicación "Frontend"/"Backend" que en realidad eran el mismo código: ahora hay una sola fuente de verdad (`frontend/` + `backend/`).

---

## 4. Referencia de la API

Todas las rutas viven bajo `http://localhost:3000/api`. Las marcadas con 🔒 requieren el header `Authorization: Bearer <token>` (el token se obtiene al hacer login o registro).

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servicio |
| POST | `/api/registro` | Crea una cuenta. Body: `{ nombres, apellidos, email, password, fechaNacimiento, intereses[] }` |
| POST | `/api/login` | Inicia sesión. Body: `{ email, password }` |
| GET 🔒 | `/api/perfil` | Devuelve los datos del usuario autenticado |
| GET | `/api/turismo` | Lista todos los destinos. Admite `?buscar=` y `?categoria=` |
| GET | `/api/turismo/:id` | Detalle de un destino |
| GET | `/api/leyendas` | Lista todas las leyendas |
| GET | `/api/leyendas/:id` | Detalle de una leyenda |
| GET | `/api/idiomas` | Lista los idiomas disponibles |
| GET | `/api/idiomas/:idioma/:nivel` | Preguntas de un nivel (ej. `/api/idiomas/Mayagna/1`) |
| GET 🔒 | `/api/progreso` | Progreso guardado del usuario (idiomas, favoritos, etc.) |
| POST 🔒 | `/api/progreso` | Guarda/actualiza el progreso del usuario |

Todas las respuestas son JSON. Los errores tienen la forma `{ "error": "mensaje" }`.

---

## 5. Sistema de diseño

| Elemento | Valor | Uso |
|---|---|---|
| Verde bosque | `#1f6d3a` | Color primario (botones, marca) |
| Verde lima | `#8bc63f` | Acentos, elementos de éxito, niveles |
| Naranja | `#f5a623` | Acentos secundarios |
| Café | `#8b5a2b` | Detalles de marca (logo) |
| Azul agua | `#3ea8dc` | Detalles de marca (logo) |
| Tipografía de títulos | Poppins | Encabezados |
| Tipografía de cuerpo | Inter | Texto general |

Todo el sistema de color está definido como variables CSS en `frontend/css/variables.css`, con un set alternativo bajo `[data-theme="oscuro"]`. Para ajustar la paleta, ese es el único archivo que necesitas tocar.

---

## 6. Nota importante sobre el entorno de desarrollo

El backend se escribió usando **únicamente los módulos nativos de Node.js** (`http`, `crypto`, `fs`, `path`, `url`) — sin Express, sin `jsonwebtoken`, sin ninguna librería de `npm`. Esto fue una decisión deliberada para que el proyecto:

1. Funcione con `node backend/server.js` sin necesitar `npm install`.
2. No dependa de conexión a internet para instalar paquetes el día de la presentación.

Si tu equipo prefiere usar Express (más común y con más documentación), la migración es sencilla porque las rutas ya están claramente separadas en el objeto `rutasAPI` — se puede pedir ese cambio en cualquier momento.

---

## 7. Siguientes pasos recomendados (para después del hackatón)

- **Base de datos real**: migrar de archivos JSON a SQLite o PostgreSQL cuando el número de usuarios crezca.
- **Multimedia**: el proyecto original referenciaba audio/video para las leyendas e idiomas que nunca se incluyeron en el zip. Falta grabar/conseguir esos archivos y colocarlos en `frontend/audio/` y `frontend/video/`.
- **Imágenes de leyendas**: actualmente el catálogo de leyendas no tiene imágenes propias (se colocó un manejo de error que las oculta si faltan). Sería ideal ilustrar cada leyenda.
- **Recuperar contraseña**: el enlace "¿Olvidaste tu contraseña?" del mockup aún no tiene lógica detrás.
- **Login social (Google/Facebook)**: los botones existen en la interfaz pero no están conectados a ningún proveedor real todavía.
- **HTTPS y variable de entorno para el secreto de tokens** antes de desplegar en producción.

---

## 8. Créditos

Proyecto **NEXORAIZ** — Equipo: Pedro Arias Rosales, Alvin Gonzalez, Zahir, Maria, Jose.
Hackatón Nicaragua 2025.
