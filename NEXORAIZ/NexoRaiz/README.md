# NexoRaiz

Plataforma web para promover el turismo, las lenguas indígenas (Mayagna y
Miskitu) y la tradición oral de Nicaragua. Proyecto para el Hackathon
Nicaragua.

## Estructura del proyecto

```
NexoRaiz/
├── backend/
│   ├── server.js          → servidor HTTP en Node.js puro (sin dependencias externas)
│   └── data/
│       ├── contenido.json → turismo, idiomas y leyendas
│       ├── usuarios.json  → cuentas registradas (arranca vacío: [])
│       └── progreso.json  → progreso de idiomas por usuario (arranca vacío: {})
├── frontend/
│   ├── index.html         → landing pública
│   ├── login.html         → inicio de sesión
│   ├── registro.html      → registro multi-paso
│   ├── app.html            → la aplicación (Turismo, Idiomas, Leyendas) ya autenticado
│   ├── css/                → estilos (variables.css tiene toda la paleta e identidad)
│   ├── js/                 → lógica de cada módulo + cliente de la API (api.js)
│   └── images/
├── database/
│   └── NexoRaiz.sql       → esquema SQL Server, de referencia para una futura migración
├── package.json
└── README.md
```

## Cómo correrlo

No necesita `npm install` — el backend usa solo módulos nativos de Node.js.

```bash
node backend/server.js
```

Abre `http://localhost:3000` en el navegador. El servidor sirve el frontend
y expone la API bajo `/api` (ver `DOCUMENTACION.md` si quieres el detalle de
cada ruta — ese archivo se mantiene con las notas técnicas completas).

## Qué se reorganizó en esta entrega

El .zip que subiste tenía varias copias sueltas del proyecto mezcladas
(carpetas `NEXORAIZ -Frontend` y `NEXORAIZ -Backent` casi idénticas, una copia
vieja anidada de la rama "tercer-momento", y archivos de una carpeta `data/`
suelta con un `server.js` distinto y un `tempCodeRunnerFile.js` de VS Code).
Dentro de `NEXORAIZ -Backent` ya existía la versión completa y funcional
(backend real + frontend con login/registro conectado a la API), documentada
en su propio `DOCUMENTACION.md`. Lo que hice aquí fue:

- Tomar esa versión completa como única fuente de verdad y descartar las
  copias duplicadas/antiguas.
- Renombrar `public/` → `frontend/` para que quede explícito "frontend" y
  "backend" como pediste (y actualicé la única línea de `server.js` que
  apuntaba a `public`).
- Mover `NexoRaiz.sql` a `database/` como referencia para cuando decidan
  migrar de JSON a una base de datos real.
- Limpiar `package.json`: tenía `express`, `cors` y `mssql` como
  dependencias, pero el servidor no importa ninguna (usa solo `http`, `fs`,
  `path`, `crypto`, `url` de Node) — las quité y dejé un script `npm start`.

No toqué la lógica de negocio, el diseño ni el contenido — solo la
organización de carpetas y archivos muertos.

## Pendientes que ya estaban documentados (sección 7 de DOCUMENTACION.md)

- Falta multimedia (audio/video) para leyendas e idiomas.
- Las leyendas todavía no tienen imagen propia.
- "¿Olvidaste tu contraseña?" y el login social son solo visuales, sin lógica.
- Antes de producción: mover el secreto de los tokens a una variable de
  entorno y servir todo por HTTPS.
