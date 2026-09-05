/* ==========================================================
   NEXORAIZ — Módulo de Turismo e Historias
   ========================================================== */

let map;
let markersGroup;
let destinosCache = [];
let categoriaActiva = "todas";
let favoritos = JSON.parse(localStorage.getItem("nexoraiz_favoritos") || "[]");

async function initTurismo() {
  if (map) {
    setTimeout(() => map.invalidateSize(), 50);
    return;
  }

  map = L.map("mapContainer").setView([12.6, -85.5], 7.2);

  const mapaCalles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    userAgent: "NexoRaiz/1.0 (contacto@nexoraiz.com)",
  });
  const mapaSatelital = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Tiles © Esri" }
  );

  mapaCalles.addTo(map);
  L.control.layers(
    { "📍 Calles": mapaCalles, "🛰️ Satélite": mapaSatelital },
    null,
    { position: "topright" }
  ).addTo(map);

  markersGroup = L.layerGroup().addTo(map);

  try {
    const data = await NexoAPI.turismo();
    destinosCache = data.resultados || [];
    renderDestinos(destinosCache);
    renderListaMini(destinosCache);
  } catch (err) {
    mostrarToast("No se pudo cargar el catálogo de turismo.", "error");
  }

  setTimeout(() => map.invalidateSize(), 200);

  document.getElementById("searchPlace")?.addEventListener("input", aplicarFiltros);
  document.querySelectorAll(".filtro-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".filtro-chip").forEach((c) => c.classList.remove("activo"));
      chip.classList.add("activo");
      categoriaActiva = chip.dataset.categoria;
      aplicarFiltros();
    });
  });
}

function aplicarFiltros() {
  const query = (document.getElementById("searchPlace")?.value || "").toLowerCase();
  let filtrados = destinosCache.filter((l) => l.nombre.toLowerCase().includes(query));
  if (categoriaActiva !== "todas") {
    filtrados = filtrados.filter((l) => l.categoria === categoriaActiva);
  }
  renderDestinos(filtrados);
  renderListaMini(filtrados);
}

function renderDestinos(lista) {
  markersGroup.clearLayers();
  lista.forEach((lugar) => {
    const marker = L.marker([lugar.coordenadas.lat, lugar.coordenadas.lng]);
    marker.bindTooltip(lugar.nombre, { permanent: false, direction: "top" });
    marker.on("click", () => {
      verDetalleTurismo(lugar.id);
      map.flyTo([lugar.coordenadas.lat, lugar.coordenadas.lng], 9.5, { animate: true, duration: 1.1 });
    });
    markersGroup.addLayer(marker);
  });
}

function renderListaMini(lista) {
  const cont = document.getElementById("turismoListaMini");
  if (!cont) return;
  if (lista.length === 0) {
    cont.innerHTML = `<p style="color:var(--text-muted);font-size:13.5px;">Sin resultados para tu búsqueda.</p>`;
    return;
  }
  cont.innerHTML = lista
    .map(
      (l) => `
      <div class="destino-mini-card" onclick="verDetalleTurismo('${l.id}'); enfocarEnMapa('${l.id}')">
        <div class="thumb" style="background-image:url('${l.imagen}')"></div>
        <div class="body">
          <strong>${l.nombre}</strong>
          <span>⭐ ${l.rating} · ${l.categoria}</span>
        </div>
      </div>`
    )
    .join("");
}

function enfocarEnMapa(id) {
  const lugar = destinosCache.find((l) => l.id === id);
  if (lugar) map.flyTo([lugar.coordenadas.lat, lugar.coordenadas.lng], 9.5, { animate: true, duration: 1.1 });
}

function verDetalleTurismo(idLugar) {
  const lugar = destinosCache.find((l) => l.id === idLugar);
  const panel = document.getElementById("placeDetails");
  if (!lugar) return;

  const esFavorito = favoritos.includes(lugar.id);
  panel.classList.remove("empty");
  panel.innerHTML = `
    <div class="place-card-modern animate-fade-in">
      <div class="place-hero-image" style="background-image:url('${lugar.imagen}')">
        <span class="rating-badge">⭐ ${lugar.rating}</span>
        <h2>${lugar.nombre}</h2>
      </div>
      <div class="place-body-content">
        <p class="description-text">${lugar.descripcion}</p>
        <div class="imperdibles-section">
          <h4>📌 Sitios Imperdibles</h4>
          <div class="badges-grid">
            ${lugar.imperdibles.map((item) => `<span class="imperdible-badge">✨ ${item}</span>`).join("")}
          </div>
        </div>
        <div class="place-actions">
          <button class="btn-fav ${esFavorito ? "activo" : ""}" onclick="toggleFavorito('${lugar.id}')">
            ${esFavorito ? "❤️ En favoritos" : "🤍 Guardar en favoritos"}
          </button>
          <button class="btn-mapa" onclick="enfocarEnMapa('${lugar.id}')">🗺️ Ver en el mapa</button>
        </div>
      </div>
    </div>
  `;
}

function toggleFavorito(id) {
  if (favoritos.includes(id)) {
    favoritos = favoritos.filter((f) => f !== id);
  } else {
    favoritos.push(id);
  }
  localStorage.setItem("nexoraiz_favoritos", JSON.stringify(favoritos));
  verDetalleTurismo(id);
}

function filtrarLugares() {
  aplicarFiltros();
}
