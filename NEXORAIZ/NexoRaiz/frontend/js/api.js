/* ==========================================================
   NEXORAIZ — Cliente de la API (frontend)
   Centraliza las llamadas fetch() hacia el backend en /api
   ========================================================== */

const NexoAPI = (() => {
  const BASE = "/api";

  function token() {
    return localStorage.getItem("nexoraiz_token");
  }

  async function request(method, ruta, body) {
    const headers = { "Content-Type": "application/json" };
    const t = token();
    if (t) headers["Authorization"] = `Bearer ${t}`;

    const res = await fetch(BASE + ruta, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let data = {};
    try { data = await res.json(); } catch { /* respuesta vacía */ }

    if (!res.ok) {
      const err = new Error(data.error || "Ocurrió un error inesperado.");
      err.status = res.status;
      throw err;
    }
    return data;
  }

  return {
    registro: (payload) => request("POST", "/registro", payload),
    login: (payload) => request("POST", "/login", payload),
    perfil: () => request("GET", "/perfil"),

    turismo: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request("GET", `/turismo${qs ? "?" + qs : ""}`);
    },
    turismoDetalle: (id) => request("GET", `/turismo/${id}`),

    leyendas: () => request("GET", "/leyendas"),

    idiomasDisponibles: () => request("GET", "/idiomas"),
    preguntasNivel: (idioma, nivel) => request("GET", `/idiomas/${idioma}/${nivel}`),

    progresoObtener: () => request("GET", "/progreso"),
    progresoGuardar: (payload) => request("POST", "/progreso", payload),

    estaAutenticado: () => Boolean(token()),
    guardarSesion: (token, usuario) => {
      localStorage.setItem("nexoraiz_token", token);
      localStorage.setItem("nexoraiz_usuario", JSON.stringify(usuario));
    },
    cerrarSesion: () => {
      localStorage.removeItem("nexoraiz_token");
      localStorage.removeItem("nexoraiz_usuario");
    },
    usuarioLocal: () => {
      try { return JSON.parse(localStorage.getItem("nexoraiz_usuario") || "null"); }
      catch { return null; }
    },
  };
})();
