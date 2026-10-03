import { getRainfall, getRainfallForLocations } from "./api/openMeteo.js";
import { initializeMap } from "./map/mapManager.js";
import { calculateMycoIndex } from "./utils/mycoIndex.js";

const elements = {
  daysButtons: [...document.querySelectorAll(".period-button")],
  detailTitle: document.querySelector("#detail-title"),
  location: document.querySelector("#detail-location"),
  total: document.querySelector("#total-rain"),
  period: document.querySelector("#period-label"),
  mycoLevel: document.querySelector("#myco-level"),
  mycoScore: document.querySelector("#myco-score"),
  scoreFill: document.querySelector("#score-fill"),
  mycoDescription: document.querySelector("#myco-description"),
  daily: document.querySelector("#daily-list"),
  message: document.querySelector("#detail-message"),
  stationStatus: document.querySelector("#station-status"),
  opacity: document.querySelector("#opacity-slider"),
  opacityValue: document.querySelector("#opacity-value")
};

let selectedDays = 7;
let selectedLocation = null;
let selectedRequest = 0;
let mapZoom = 6;
const map = initializeMap({
  onMapClick: (latitude, longitude) => selectLocation(latitude, longitude),
  onZoom: (zoom) => {
    mapZoom = zoom;
    updateStationStatus();
  }
});

function updateStationStatus(message) {
  elements.stationStatus.textContent = message ?? `18 estaciones de referencia · zoom ${mapZoom}`;
}

function formatCoordinate(latitude, longitude) {
  const latDirection = latitude >= 0 ? "N" : "S";
  const lonDirection = longitude >= 0 ? "E" : "O";
  return `${Math.abs(latitude).toFixed(4)}° ${latDirection}, ${Math.abs(longitude).toFixed(4)}° ${lonDirection}`;
}

function getRecentDays(daily) {
  return daily.slice(-selectedDays);
}

function renderDaily(daily) {
  const recentDays = [...getRecentDays(daily)].reverse();
  elements.daily.replaceChildren();
  const validAmounts = recentDays
    .map(({ precipitation }) => precipitation)
    .filter(Number.isFinite);
  const maxAmount = Math.max(1, ...validAmounts);

  recentDays.forEach(({ date, precipitation }) => {
    const row = document.createElement("div");
    row.className = "daily-row";
    const dateLabel = document.createElement("span");
    dateLabel.className = "daily-date";
    dateLabel.textContent = new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "2-digit", month: "short" })
      .format(new Date(`${date}T12:00:00`));
    const track = document.createElement("span");
    track.className = "daily-track";
    const fill = document.createElement("span");
    fill.style.width = Number.isFinite(precipitation) ? `${(precipitation / maxAmount) * 100}%` : "0%";
    track.append(fill);
    const amount = document.createElement("span");
    amount.className = "daily-amount";
    amount.textContent = Number.isFinite(precipitation) ? `${precipitation.toFixed(1)} mm` : "Sin dato";
    row.append(dateLabel, track, amount);
    elements.daily.append(row);
  });
}

function renderLocation(data) {
  const recent = getRecentDays(data.daily);
  const validValues = recent
    .map(({ precipitation }) => precipitation)
    .filter(Number.isFinite);
  const total = validValues.reduce((sum, value) => sum + value, 0);
  const index = calculateMycoIndex(data.daily, selectedDays);

  elements.total.textContent = validValues.length ? total.toFixed(1) : "--";
  elements.mycoLevel.textContent = index?.label ?? "Sin datos";
  elements.mycoScore.textContent = index ? `${index.score}` : "--";
  elements.scoreFill.style.width = `${index?.score ?? 0}%`;
  elements.mycoDescription.textContent = index?.note ?? "No hay precipitación diaria disponible para este periodo.";
  renderDaily(data.daily);

  if (validValues.length < selectedDays) {
    elements.message.textContent = `Datos parciales: ${validValues.length} de ${selectedDays} días disponibles. El histórico reciente puede tener demora.`;
  } else {
    elements.message.textContent = "";
  }
}

async function selectLocation(latitude, longitude) {
  selectedLocation = { latitude, longitude, daily: [] };
  const requestId = ++selectedRequest;
  elements.detailTitle.textContent = "Ubicación consultada";
  elements.location.textContent = formatCoordinate(latitude, longitude);
  elements.total.textContent = "…";
  elements.mycoLevel.textContent = "Consultando";
  elements.mycoScore.textContent = "--";
  elements.scoreFill.style.width = "0%";
  elements.mycoDescription.textContent = "Consultando el histórico diario de precipitación.";
  elements.daily.replaceChildren();
  elements.message.textContent = "Conectando con Open-Meteo…";
  elements.message.classList.add("is-loading");

  try {
    const data = await getRainfall(latitude, longitude, 14);
    if (requestId !== selectedRequest) return;
    selectedLocation = data;
    renderLocation(data);
  } catch (error) {
    if (requestId !== selectedRequest) return;
    elements.total.textContent = "--";
    elements.mycoLevel.textContent = "Sin datos";
    elements.mycoDescription.textContent = "No se pudo calcular la estimación.";
    elements.daily.textContent = "No hay datos diarios disponibles.";
    elements.message.textContent = error.message || "No se pudo consultar Open-Meteo. Inténtalo de nuevo.";
  } finally {
    if (requestId === selectedRequest) elements.message.classList.remove("is-loading");
  }
}

function setPeriod(days) {
  selectedDays = days;
  elements.daysButtons.forEach((button) => {
    const active = Number(button.dataset.days) === days;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  elements.period.textContent = `${days} DÍAS`;
  map.setPeriod(days);
  if (selectedLocation?.daily?.length) renderLocation(selectedLocation);
}

elements.daysButtons.forEach((button) => {
  button.addEventListener("click", () => setPeriod(Number(button.dataset.days)));
});

elements.opacity.addEventListener("input", (event) => {
  const opacity = Number(event.currentTarget.value);
  map.setOpacity(opacity / 100);
  elements.opacityValue.value = `${opacity}%`;
});

async function loadStations() {
  const stations = map.getStations();
  updateStationStatus(`Cargando ${stations.length} estaciones...`);
  try {
    const locations = await getRainfallForLocations(stations, 14);
    map.setStationData(locations);
    updateStationStatus(`${locations.length} estaciones de referencia · zoom ${mapZoom}`);
  } catch (error) {
    updateStationStatus("Estaciones sin datos · consulta un punto");
    console.error("No se pudieron cargar las estaciones de lluvia:", error);
  }
}

setPeriod(selectedDays);
loadStations();
