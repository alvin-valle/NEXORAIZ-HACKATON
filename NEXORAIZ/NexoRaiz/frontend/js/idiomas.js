/* ==========================================================
   NEXORAIZ — Módulo de Aprende Idiomas (Mayagna / Miskito)
   ========================================================== */

let language = "";
let level = 1;
let index = 0;
let points = 0;
let lives = 5;
let preguntasNivel = [];
let progresoIdiomas = {}; // { Mayagna: { unlockedLevel: 2 }, Miskito: {...} }

async function initIdiomas() {
  try {
    const data = await NexoAPI.progresoObtener();
    progresoIdiomas = (data.progreso && data.progreso.idiomas) || {};
  } catch {
    progresoIdiomas = {};
  }
}

function cambiarVista(idVisible) {
  document.querySelectorAll(".card-idioma").forEach((el) => el.classList.remove("visible"));
  document.getElementById(idVisible)?.classList.add("visible");
}

function openMenu() { cambiarVista("menu"); }
function backToWelcome() { cambiarVista("welcome"); }

function selectLanguage(lang) {
  language = lang;
  cambiarVista("levels");
  document.getElementById("languageTitle").innerHTML = lang;
  pintarNiveles();
}

function unlockedLevelActual() {
  return (progresoIdiomas[language] && progresoIdiomas[language].unlockedLevel) || 1;
}

function pintarNiveles() {
  const unlocked = unlockedLevelActual();
  for (let i = 1; i <= 5; i++) {
    const node = document.getElementById("level" + i);
    if (!node) continue;
    if (i <= unlocked) {
      node.classList.remove("locked");
      node.innerHTML = i;
    } else {
      node.classList.add("locked");
      node.innerHTML = "🔒";
    }
  }
}

function backMenu() { cambiarVista("menu"); }

function openLevel(lv) {
  if (lv <= unlockedLevelActual()) {
    startLevel(lv);
  } else {
    mostrarToast("🔒 Debes completar el nivel anterior.", "error");
  }
}

async function startLevel(lv) {
  level = lv;
  index = 0;
  points = 0;
  lives = 5;

  updateLives();
  document.getElementById("points").innerHTML = points;

  cambiarVista("game");
  document.getElementById("gameLanguage").innerHTML = language;
  document.getElementById("levelName").innerHTML = "Nivel " + level;

  try {
    const data = await NexoAPI.preguntasNivel(language, level);
    preguntasNivel = data.preguntas || [];
  } catch {
    preguntasNivel = [];
  }

  loadQuestion();
}

function loadQuestion() {
  if (preguntasNivel.length === 0) {
    document.getElementById("question").innerHTML = "⚠️ Próximamente";
    document.getElementById("options").innerHTML = `
      <div class="complete">
        <p>Aún estamos preparando las lecciones para este nivel.</p>
        <button class="main-btn" onclick="backLevels()">Volver al mapa</button>
      </div>`;
    return;
  }

  if (index >= preguntasNivel.length) {
    return completarNivel();
  }

  const q = preguntasNivel[index];
  document.getElementById("question").innerHTML = q.q;
  document.getElementById("count").innerHTML = index + 1;

  document.getElementById("options").innerHTML = q.o
    .map((op) => `<button class="option" onclick="checkAnswer(this, '${op.replace(/'/g, "\\'")}')">${op}</button>`)
    .join("");

  const progreso = (index / preguntasNivel.length) * 100;
  document.getElementById("bar").style.width = progreso + "%";
}

async function completarNivel() {
  if (level < 5) {
    const unlocked = unlockedLevelActual();
    if (level + 1 > unlocked) {
      progresoIdiomas[language] = { ...(progresoIdiomas[language] || {}), unlockedLevel: level + 1 };
      await guardarProgresoIdiomas();
    }
  }

  document.getElementById("question").innerHTML = "🎉 ¡Nivel completado!";
  document.getElementById("options").innerHTML = `
    <div class="complete">
      <h2>Excelente</h2>
      <p>Obtuviste ${points} puntos</p>
      <button class="main-btn" onclick="backLevels()">Continuar</button>
    </div>`;
  document.getElementById("bar").style.width = "100%";
}

async function guardarProgresoIdiomas() {
  try {
    await NexoAPI.progresoGuardar({ idiomas: progresoIdiomas });
  } catch {
    /* si falla, el progreso queda solo en memoria de esta sesión */
  }
}

function checkAnswer(boton, op) {
  const q = preguntasNivel[index];
  document.querySelectorAll(".option").forEach((b) => (b.disabled = true));

  if (op === q.a) {
    boton.classList.add("correcta");
    points += 10;
    document.getElementById("points").innerHTML = points;
  } else {
    boton.classList.add("incorrecta");
    lives--;
    updateLives();
  }

  setTimeout(() => {
    if (lives <= 0) {
      document.getElementById("question").innerHTML = "💀 Te quedaste sin vidas";
      document.getElementById("options").innerHTML = `
        <div class="complete">
          <h2>Juego terminado</h2>
          <p>Perdiste todas tus oportunidades</p>
          <button class="main-btn" onclick="restartLevel()">🔄 Reintentar nivel</button>
        </div>`;
      document.getElementById("bar").style.width = "100%";
      return;
    }
    index++;
    loadQuestion();
  }, 550);
}

function updateLives() {
  document.getElementById("lives").innerHTML = "❤️".repeat(Math.max(lives, 0)) || "💀";
}

function restartLevel() {
  index = 0;
  points = 0;
  lives = 5;
  document.getElementById("points").innerHTML = points;
  updateLives();
  loadQuestion();
}

function backLevels() {
  pintarNiveles();
  cambiarVista("levels");
}
