/**
 * NEXORAIZ — Backend
 * ---------------------------------------------------------
 * Servidor HTTP en Node.js puro (sin dependencias externas)
 * Sirve el frontend estático (/frontend) y expone una API REST
 * bajo /api para autenticación, turismo, idiomas, leyendas
 * y progreso del usuario.
 *
 * Persistencia: archivos JSON en backend/data/ (usuarios.json,
 * progreso.json). Es suficiente para un hackathon/demo; para
 * producción se recomienda migrar a una base de datos real
 * (ver DOCUMENTACION.md, sección "Siguientes pasos").
 *
 * Ejecutar con:  node backend/server.js
 * ---------------------------------------------------------
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

// ----------------------------- Config -----------------------------
const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT_DIR, "frontend");
const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "usuarios.json");
const PROGRESO_FILE = path.join(DATA_DIR, "progreso.json");
const CONTENIDO_FILE = path.join(DATA_DIR, "contenido.json");

// Clave secreta para firmar tokens de sesión (HMAC).
// En producción esto debe venir de una variable de entorno.
const JWT_SECRET = process.env.NEXORAIZ_SECRET || "nexoraiz-hackathon-nicaragua-2025-secret";

// ----------------------------- Utilidades de datos -----------------------------

function leerJSON(filePath, valorPorDefecto) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return valorPorDefecto;
  }
}

function escribirJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function asegurarArchivosDeDatos() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) escribirJSON(USERS_FILE, []);
  if (!fs.existsSync(PROGRESO_FILE)) escribirJSON(PROGRESO_FILE, {});
}

const CONTENIDO = leerJSON(CONTENIDO_FILE, { turismo: [], idiomas: {}, leyendas: [] });

// ----------------------------- Auth: hash + tokens -----------------------------

function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function verificarPassword(password, salt, hashGuardado) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hashGuardado));
}

function base64url(input) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generarToken(payload) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify({ ...payload, iat: Date.now() }));
  const firma = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${header}.${body}.${firma}`;
}

function verificarToken(token) {
  if (!token) return null;
  const partes = token.split(".");
  if (partes.length !== 3) return null;
  const [header, body, firma] = partes;
  const firmaEsperada = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  if (firma !== firmaEsperada) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64").toString("utf-8"));
    return payload;
  } catch {
    return null;
  }
}

function obtenerUsuarioDesdeRequest(req) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const payload = verificarToken(token);
  if (!payload) return null;
  const usuarios = leerJSON(USERS_FILE, []);
  return usuarios.find((u) => u.id === payload.id) || null;
}

// ----------------------------- Helpers HTTP -----------------------------

function enviarJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

function leerCuerpo(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 5 * 1024 * 1024) req.destroy(); // límite 5MB
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
};

function servirArchivoEstatico(req, res, urlPath) {
  let filePath = urlPath === "/" ? "/index.html" : urlPath;
  filePath = path.join(PUBLIC_DIR, decodeURIComponent(filePath));

  // Evitar path traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Prohibido");
  }

  fs.readFile(filePath, (err, contenido) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      return res.end("<h1>404</h1><p>Archivo no encontrado en NEXORAIZ.</p>");
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(contenido);
  });
}

// ----------------------------- Rutas de la API -----------------------------

const rutasAPI = {
  // --- Salud del servicio ---
  "GET /api/health": (req, res) => enviarJSON(res, 200, { ok: true, servicio: "NEXORAIZ API", hora: new Date().toISOString() }),

  // --- Autenticación ---
  "POST /api/registro": async (req, res) => {
    const body = await leerCuerpo(req);
    const { nombres, apellidos, email, password, fechaNacimiento, intereses } = body;

    if (!nombres || !apellidos || !email || !password) {
      return enviarJSON(res, 400, { error: "Faltan campos obligatorios (nombres, apellidos, email, password)." });
    }
    if (password.length < 6) {
      return enviarJSON(res, 400, { error: "La contraseña debe tener al menos 6 caracteres." });
    }

    const usuarios = leerJSON(USERS_FILE, []);
    if (usuarios.find((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
      return enviarJSON(res, 409, { error: "Ya existe una cuenta registrada con ese correo." });
    }

    const { salt, hash } = hashPassword(password);
    const nuevoUsuario = {
      id: crypto.randomUUID(),
      nombres,
      apellidos,
      email,
      fechaNacimiento: fechaNacimiento || null,
      intereses: Array.isArray(intereses) ? intereses : [],
      salt,
      hash,
      creadoEn: new Date().toISOString(),
    };
    usuarios.push(nuevoUsuario);
    escribirJSON(USERS_FILE, usuarios);

    const token = generarToken({ id: nuevoUsuario.id, email: nuevoUsuario.email });
    const { salt: _s, hash: _h, ...usuarioPublico } = nuevoUsuario;
    enviarJSON(res, 201, { token, usuario: usuarioPublico });
  },

  "POST /api/login": async (req, res) => {
    const body = await leerCuerpo(req);
    const { email, password } = body;
    if (!email || !password) {
      return enviarJSON(res, 400, { error: "Debes indicar correo y contraseña." });
    }
    const usuarios = leerJSON(USERS_FILE, []);
    const usuario = usuarios.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (!usuario || !verificarPassword(password, usuario.salt, usuario.hash)) {
      return enviarJSON(res, 401, { error: "Correo o contraseña incorrectos." });
    }
    const token = generarToken({ id: usuario.id, email: usuario.email });
    const { salt: _s, hash: _h, ...usuarioPublico } = usuario;
    enviarJSON(res, 200, { token, usuario: usuarioPublico });
  },

  "GET /api/perfil": (req, res) => {
    const usuario = obtenerUsuarioDesdeRequest(req);
    if (!usuario) return enviarJSON(res, 401, { error: "No autenticado." });
    const { salt: _s, hash: _h, ...usuarioPublico } = usuario;
    enviarJSON(res, 200, { usuario: usuarioPublico });
  },

  // --- Turismo ---
  "GET /api/turismo": (req, res, query) => {
    let lista = CONTENIDO.turismo;
    if (query.get("buscar")) {
      const q = query.get("buscar").toLowerCase();
      lista = lista.filter((l) => l.nombre.toLowerCase().includes(q) || l.departamento.toLowerCase().includes(q));
    }
    if (query.get("categoria") && query.get("categoria") !== "todas") {
      lista = lista.filter((l) => l.categoria.toLowerCase() === query.get("categoria").toLowerCase());
    }
    enviarJSON(res, 200, { total: lista.length, resultados: lista });
  },

  // --- Leyendas ---
  "GET /api/leyendas": (req, res) => enviarJSON(res, 200, { total: CONTENIDO.leyendas.length, resultados: CONTENIDO.leyendas }),

  // --- Idiomas ---
  "GET /api/idiomas": (req, res) => enviarJSON(res, 200, { idiomas: Object.keys(CONTENIDO.idiomas) }),

  // --- Progreso del usuario (protegido) ---
  "GET /api/progreso": (req, res) => {
    const usuario = obtenerUsuarioDesdeRequest(req);
    if (!usuario) return enviarJSON(res, 401, { error: "No autenticado." });
    const progresoTotal = leerJSON(PROGRESO_FILE, {});
    enviarJSON(res, 200, { progreso: progresoTotal[usuario.id] || {} });
  },

  "POST /api/progreso": async (req, res) => {
    const usuario = obtenerUsuarioDesdeRequest(req);
    if (!usuario) return enviarJSON(res, 401, { error: "No autenticado." });
    const body = await leerCuerpo(req);
    const progresoTotal = leerJSON(PROGRESO_FILE, {});
    progresoTotal[usuario.id] = { ...(progresoTotal[usuario.id] || {}), ...body, actualizadoEn: new Date().toISOString() };
    escribirJSON(PROGRESO_FILE, progresoTotal);
    enviarJSON(res, 200, { progreso: progresoTotal[usuario.id] });
  },
};

// Rutas dinámicas (con parámetros): /api/turismo/:id  /api/idiomas/:idioma/:nivel
function manejarRutaDinamica(req, res, method, segments, query) {
  // /api/turismo/:id
  if (method === "GET" && segments[0] === "turismo" && segments[1]) {
    const lugar = CONTENIDO.turismo.find((l) => l.id === segments[1]);
    if (!lugar) return enviarJSON(res, 404, { error: "Destino no encontrado." });
    return enviarJSON(res, 200, { resultado: lugar });
  }
  // /api/leyendas/:id
  if (method === "GET" && segments[0] === "leyendas" && segments[1]) {
    const leyenda = CONTENIDO.leyendas.find((l) => l.id === segments[1]);
    if (!leyenda) return enviarJSON(res, 404, { error: "Leyenda no encontrada." });
    return enviarJSON(res, 200, { resultado: leyenda });
  }
  // /api/idiomas/:idioma/:nivel
  if (method === "GET" && segments[0] === "idiomas" && segments[1] && segments[2]) {
    const idioma = CONTENIDO.idiomas[segments[1]];
    const preguntas = idioma ? idioma[segments[2]] || [] : [];
    return enviarJSON(res, 200, { idioma: segments[1], nivel: segments[2], preguntas });
  }
  return false;
}

// ----------------------------- Servidor HTTP -----------------------------

asegurarArchivosDeDatos();

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method.toUpperCase();

  // CORS preflight
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    return res.end();
  }

  if (url.pathname.startsWith("/api/")) {
    const clave = `${method} ${url.pathname}`;
    try {
      if (rutasAPI[clave]) {
        return await rutasAPI[clave](req, res, url.searchParams);
      }
      const segments = url.pathname.replace("/api/", "").split("/").filter(Boolean);
      const manejado = manejarRutaDinamica(req, res, method, segments, url.searchParams);
      if (manejado === false) {
        return enviarJSON(res, 404, { error: "Ruta de API no encontrada." });
      }
    } catch (err) {
      console.error("Error en API:", err);
      return enviarJSON(res, 500, { error: "Error interno del servidor." });
    }
    return;
  }

  // Cualquier otra ruta => archivos estáticos del frontend
  return servirArchivoEstatico(req, res, url.pathname);
});

servidor.listen(PORT, () => {
  console.log("=================================================");
  console.log("  🌿 NEXORAIZ — Raíces que nos unen");
  console.log(`  Servidor corriendo en: http://localhost:${PORT}`);
  console.log("  API disponible en:     /api/...");
  console.log("=================================================");
});
