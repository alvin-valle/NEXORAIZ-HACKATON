/* ==========================================================
   NEXORAIZ — Lógica de autenticación (login.html / registro.html)
   ========================================================== */

function mostrarMensajeForm(elId, mensaje, tipo) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = mensaje;
  el.className = "form-msg visible " + tipo;
}

/* -------------------- LOGIN -------------------- */
function initLogin() {
  const form = document.getElementById("form-login");
  if (!form) return;

  // Si ya hay sesión activa, ir directo a la app
  if (NexoAPI.estaAutenticado()) {
    window.location.href = "app.html";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const btn = form.querySelector("button[type=submit]");

    if (!email || !password) {
      return mostrarMensajeForm("login-msg", "Completa correo y contraseña.", "error");
    }

    btn.disabled = true;
    btn.textContent = "Ingresando...";
    try {
      const data = await NexoAPI.login({ email, password });
      NexoAPI.guardarSesion(data.token, data.usuario);
      mostrarMensajeForm("login-msg", "¡Bienvenido de nuevo! Redirigiendo...", "exito");
      setTimeout(() => (window.location.href = "app.html"), 500);
    } catch (err) {
      mostrarMensajeForm("login-msg", err.message, "error");
      btn.disabled = false;
      btn.textContent = "Iniciar sesión →";
    }
  });

  const togglePwd = document.getElementById("toggle-login-pwd");
  if (togglePwd) {
    togglePwd.addEventListener("click", () => {
      const input = document.getElementById("login-password");
      input.type = input.type === "password" ? "text" : "password";
      togglePwd.textContent = input.type === "password" ? "👁️" : "🙈";
    });
  }
}

/* -------------------- REGISTRO (multi-paso) -------------------- */
const RegistroEstado = {
  pasoActual: 1,
  datos: { intereses: [] },
};

function initRegistro() {
  const form = document.getElementById("form-registro");
  if (!form) return;

  if (NexoAPI.estaAutenticado()) {
    window.location.href = "app.html";
    return;
  }

  actualizarPasoUI();

  document.querySelectorAll(".interes-card").forEach((card) => {
    card.addEventListener("click", () => {
      const valor = card.dataset.interes;
      card.classList.toggle("seleccionado");
      if (card.classList.contains("seleccionado")) {
        if (!RegistroEstado.datos.intereses.includes(valor)) RegistroEstado.datos.intereses.push(valor);
      } else {
        RegistroEstado.datos.intereses = RegistroEstado.datos.intereses.filter((i) => i !== valor);
      }
    });
  });

  document.getElementById("btn-siguiente-1")?.addEventListener("click", () => {
    if (!validarPaso1()) return;
    RegistroEstado.pasoActual = 2;
    actualizarPasoUI();
  });

  document.getElementById("btn-volver-2")?.addEventListener("click", () => {
    RegistroEstado.pasoActual = 1;
    actualizarPasoUI();
  });

  document.getElementById("btn-siguiente-2")?.addEventListener("click", async () => {
    if (RegistroEstado.datos.intereses.length === 0) {
      return mostrarToast("Selecciona al menos un interés.", "error");
    }
    await enviarRegistro();
  });

  ["toggle-pwd-1", "toggle-pwd-2"].forEach((id, i) => {
    document.getElementById(id)?.addEventListener("click", () => {
      const inputId = i === 0 ? "reg-password" : "reg-password-confirm";
      const input = document.getElementById(inputId);
      input.type = input.type === "password" ? "text" : "password";
    });
  });

  form.addEventListener("submit", (e) => e.preventDefault());
}

function validarPaso1() {
  const nombres = document.getElementById("reg-nombres").value.trim();
  const apellidos = document.getElementById("reg-apellidos").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const emailConfirm = document.getElementById("reg-email-confirm").value.trim();
  const password = document.getElementById("reg-password").value;
  const passwordConfirm = document.getElementById("reg-password-confirm").value;
  const dia = document.getElementById("reg-dia").value;
  const mes = document.getElementById("reg-mes").value;
  const anio = document.getElementById("reg-anio").value;

  if (!nombres || !apellidos || !email || !password) {
    mostrarToast("Completa todos los campos obligatorios.", "error");
    return false;
  }
  if (email.toLowerCase() !== emailConfirm.toLowerCase()) {
    mostrarToast("Los correos electrónicos no coinciden.", "error");
    return false;
  }
  if (password.length < 6) {
    mostrarToast("La contraseña debe tener al menos 6 caracteres.", "error");
    return false;
  }
  if (password !== passwordConfirm) {
    mostrarToast("Las contraseñas no coinciden.", "error");
    return false;
  }

  RegistroEstado.datos.nombres = nombres;
  RegistroEstado.datos.apellidos = apellidos;
  RegistroEstado.datos.email = email;
  RegistroEstado.datos.password = password;
  RegistroEstado.datos.fechaNacimiento = dia && mes && anio ? `${anio}-${mes}-${dia}` : null;
  return true;
}

async function enviarRegistro() {
  const btn = document.getElementById("btn-siguiente-2");
  btn.disabled = true;
  btn.textContent = "Creando cuenta...";
  try {
    const data = await NexoAPI.registro(RegistroEstado.datos);
    NexoAPI.guardarSesion(data.token, data.usuario);
    RegistroEstado.pasoActual = 3;
    actualizarPasoUI();
  } catch (err) {
    mostrarToast(err.message, "error");
    btn.disabled = false;
    btn.textContent = "Crear cuenta →";
  }
}

function actualizarPasoUI() {
  const { pasoActual } = RegistroEstado;
  [1, 2, 3].forEach((n) => {
    const panel = document.getElementById(`paso-${n}`);
    if (panel) panel.style.display = n === pasoActual ? "block" : "none";
    const dot = document.getElementById(`dot-${n}`);
    if (dot) {
      dot.classList.remove("activo", "hecho");
      if (n < pasoActual) dot.classList.add("hecho");
      else if (n === pasoActual) dot.classList.add("activo");
    }
  });
}

function irAlApp() {
  window.location.href = "app.html";
}

/* -------------------- Guardia de sesión para app.html -------------------- */
function requerirSesion() {
  if (!NexoAPI.estaAutenticado()) {
    window.location.href = "login.html";
  }
}

function cerrarSesionYRedirigir() {
  NexoAPI.cerrarSesion();
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  initLogin();
  initRegistro();
});
