/* ==========================================================
   NEXORAIZ — Módulo de Leyendas y Mitos
   ========================================================== */

let leyendasCache = [];

async function initLeyendas() {
  const listaBox = document.getElementById("listaLeyendas");
  if (!listaBox) return;

  try {
    const data = await NexoAPI.leyendas();
    leyendasCache = data.resultados || [];
  } catch {
    mostrarToast("No se pudo cargar el catálogo de leyendas.", "error");
    return;
  }

  listaBox.innerHTML = "";
  leyendasCache.forEach((leyenda) => {
    const item = document.createElement("div");
    item.className = "leyenda-item-btn";
    item.id = `leyenda-btn-${leyenda.id}`;
    item.innerHTML = `<h4>${leyenda.titulo}</h4><small>📍 Origen: ${leyenda.origen}</small>`;
    item.onclick = () => verLeyenda(leyenda.id);
    listaBox.appendChild(item);
  });
}

function verLeyenda(idLeyenda) {
  const leyenda = leyendasCache.find((l) => l.id === idLeyenda);
  const viewer = document.getElementById("leyendaViewer");
  if (!leyenda) return;

  document.querySelectorAll(".leyenda-item-btn").forEach((el) => el.classList.remove("activo"));
  document.getElementById(`leyenda-btn-${idLeyenda}`)?.classList.add("activo");

  viewer.innerHTML = `
    <div class="leyenda-header-view">
      <h2>${leyenda.titulo}</h2>
      <span class="tag-origen">${leyenda.origen}</span>
    </div>
    <div class="leyenda-media">
      <img src="${leyenda.imagen}" alt="${leyenda.titulo}" class="leyenda-img" onerror="this.parentElement.style.display='none'">
    </div>
    <div class="leyenda-content-text">
      <p class="sinopsis-text">"${leyenda.sinopsis}"</p>
      <hr>
      <p class="narracion-p">${leyenda.narracion}</p>
    </div>
  `;
}
