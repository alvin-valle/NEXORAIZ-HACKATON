/* ==========================================================
   NEXORAIZ — app.html: shell principal (sidebar, navbar, sesión)
   ========================================================== */

let modulos = {};

async function initApp() {
  requerirSesion();
  if (!NexoAPI.estaAutenticado()) return;

  modulos = {
    inicio: document.getElementById("inicio"),
    turismo: document.getElementById("turismo"),
    idiomas: document.getElementById("idiomas"),
    leyendas: document.getElementById("leyendas"),
  };

  pintarUsuarioEnNavbar();

  if (typeof initTurismo === "function") initTurismo();
  if (typeof initLeyendas === "function") initLeyendas();
  if (typeof initIdiomas === "function") initIdiomas();

  mostrarModulo("inicio");

  document.getElementById("btn-cerrar-sesion")?.addEventListener("click", cerrarSesionYRedirigir);
}

function pintarUsuarioEnNavbar() {
  const usuario = NexoAPI.usuarioLocal();
  if (!usuario) return;
  const inicial = (usuario.nombres || "?").charAt(0).toUpperCase();
  const nombreCompleto = `${usuario.nombres} ${usuario.apellidos || ""}`.trim();

  document.querySelectorAll("[data-user-avatar]").forEach((el) => (el.textContent = inicial));
  document.querySelectorAll("[data-user-name]").forEach((el) => (el.textContent = usuario.nombres));
  document.querySelectorAll("[data-user-fullname]").forEach((el) => (el.textContent = nombreCompleto));
}

function mostrarModulo(nombreModulo) {
  if (!modulos[nombreModulo]) return;

  for (let key in modulos) {
    if (modulos[key]) modulos[key].classList.remove("activo");
    const btn = document.getElementById(`btn-${key}`);
    if (btn) btn.classList.remove("activo");
  }

  modulos[nombreModulo].classList.add("activo");
  const btnActivo = document.getElementById(`btn-${nombreModulo}`);
  if (btnActivo) btnActivo.classList.add("activo");

  if (nombreModulo === "turismo" && typeof map !== "undefined" && map) {
    setTimeout(() => map.invalidateSize(), 150);
  }
}

document.addEventListener("DOMContentLoaded", initApp);
