import { getRainfall, getRainfallForLocations } from "./api/openMeteo.js";
import { searchPopulations } from "./api/geocoding.js";
import { initializeMap } from "./map/mapManager.js";
import { estimateFruitingProbability } from "./utils/mycoIndex.js";
import { SPECIES_PROFILES } from "./utils/speciesProfiles.js";

const elements = {
  daysButtons: [...document.querySelectorAll(".period-button")],
  detailTitle: document.querySelector("#detail-title"),
  location: document.querySelector("#detail-location"),
  total: document.querySelector("#total-rain"),
  period: document.querySelector("#period-label"),
  forecastHorizon: document.querySelector("#forecast-horizon"),
  forecastToday: document.querySelector("#forecast-today"),
  forecastTodayLevel: document.querySelector("#forecast-today-level"),
  forecastTodayReason: document.querySelector("#forecast-today-reason"),
  forecastFuture: document.querySelector("#forecast-future"),
  forecastFutureLevel: document.querySelector("#forecast-future-level"),
  forecastFutureReason: document.querySelector("#forecast-future-reason"),
  forecastFutureDate: document.querySelector("#forecast-future-date"),
  daily: document.querySelector("#daily-list"),
  message: document.querySelector("#detail-message"),
  stationStatus: document.querySelector("#station-status"),
  habitatStatus: document.querySelector("#habitat-status"),
  opacity: document.querySelector("#opacity-slider"),
  opacityValue: document.querySelector("#opacity-value"),
  populationForm: document.querySelector("#population-search"),
  populationInput: document.querySelector("#population-input"),
  populationResults: document.querySelector("#population-results"),
  populationStatus: document.querySelector("#population-status"),
  speciesSelect: document.querySelector("#species-select"),
  speciesTitle: document.querySelector("#species-title"),
  speciesScientific: document.querySelector("#species-scientific"),
  speciesRain: document.querySelector("#species-rain"),
  speciesIncubation: document.querySelector("#species-incubation"),
  speciesTemperature: document.querySelector("#species-temperature"),
  speciesHabitat: document.querySelector("#species-habitat"),
  speciesSeason: document.querySelector("#species-season"),
  speciesNote: document.querySelector("#species-note")
};

let selectedDays = 21;
let selectedLocation = null;
let selectedRequest = 0;
let selectedProfile = SPECIES_PROFILES[0];
let forecastHorizon = 7;
let populationTimer = null;
let populationRequest = 0;
let mapZoom = 6;
const map = initializeMap({
  onMapClick: (latitude, longitude) => selectLocation(latitude, longitude),
  onHabitatStatus: (message) => {
    elements.habitatStatus.textContent = message;
    elements.habitatStatus.hidden = !message;
  },
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

function getSpainToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(date, days) {
  const result = new Date(`${date}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

function formatForecastDate(date) {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" })
    .format(new Date(`${date}T12:00:00`));
}

function renderSpeciesProfile(profile) {
  elements.speciesTitle.textContent = profile.name;
  elements.speciesScientific.textContent = profile.scientificName;
  elements.speciesRain.textContent = `≈${profile.rainfall.minimum}–${profile.rainfall.maximum} mm / ${profile.rainfall.windowDays} días (óptimo ~${profile.rainfall.ideal} mm)`;
  elements.speciesIncubation.textContent = `${profile.incubation.minimum}–${profile.incubation.maximum} días tras lluvia desencadenante`;
  elements.speciesTemperature.textContent = `Media ${profile.temperature.mean.minimum}–${profile.temperature.mean.maximum} °C · mín. nocturna ${profile.temperature.night.minimum}–${profile.temperature.night.maximum} °C`;
  elements.speciesHabitat.textContent = profile.habitat;
  elements.speciesSeason.textContent = profile.season;
  elements.speciesNote.textContent = profile.note;
}

SPECIES_PROFILES.forEach((profile) => {
  const option = document.createElement("option");
  option.value = profile.id;
  option.textContent = profile.name;
  elements.speciesSelect.append(option);
});
renderSpeciesProfile(selectedProfile);

function getRecentDays(daily) {
  return daily.filter(({ date }) => date <= getSpainToday()).slice(-selectedDays);
}

function describeEstimate(estimate) {
  if (!estimate) return "Previsión no disponible para esta fecha.";
  if (estimate.triggerDate) {
    return `Lluvia desencadenante: ${estimate.rainfall} mm · incubación: ${estimate.incubationDays} días.`;
  }
  return estimate.reason;
}

function renderProbability(prefix, estimate) {
  const probability = estimate ? `${estimate.probability}%` : "--%";
  elements[`forecast${prefix}`].textContent = probability;
  elements[`forecast${prefix}Level`].textContent = estimate?.label ?? "Sin datos";
  elements[`forecast${prefix}Reason`].textContent = describeEstimate(estimate);
}

function renderForecast(daily) {
  const today = getSpainToday();
  const futureDate = addDays(today, forecastHorizon);
  elements.forecastFutureDate.textContent = `En ${forecastHorizon} días · ${formatForecastDate(futureDate)}`;
  renderProbability("Today", estimateFruitingProbability(daily, today, selectedProfile));
  renderProbability("Future", estimateFruitingProbability(daily, futureDate, selectedProfile));
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

  elements.total.textContent = validValues.length ? total.toFixed(1) : "--";
  renderDaily(data.daily);
  renderForecast(data.daily);

  if (validValues.length < selectedDays) {
    elements.message.textContent = `Datos parciales: ${validValues.length} de ${selectedDays} días disponibles.`;
  } else {
    elements.message.textContent = "";
  }
}

async function selectLocation(latitude, longitude, name = null) {
  selectedLocation = { latitude, longitude, name, daily: [] };
  const requestId = ++selectedRequest;
  elements.detailTitle.textContent = selectedLocation.name ?? "Ubicación consultada";
  elements.location.textContent = formatCoordinate(latitude, longitude);
  elements.total.textContent = "…";
  renderProbability("Today", null);
  renderProbability("Future", null);
  elements.daily.replaceChildren();
  elements.message.textContent = "Conectando con Open-Meteo…";
  elements.message.classList.add("is-loading");

  try {
    const data = await getRainfall(latitude, longitude);
    if (requestId !== selectedRequest) return;
    selectedLocation = { ...data, name: selectedLocation.name };
    renderLocation(data);
  } catch (error) {
    if (requestId !== selectedRequest) return;
    elements.total.textContent = "--";
    renderProbability("Today", null);
    renderProbability("Future", null);
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

function setForecastHorizon(days) {
  forecastHorizon = days;
  if (selectedLocation?.daily?.length) renderForecast(selectedLocation.daily);
}

function closePopulationResults() {
  elements.populationResults.hidden = true;
  elements.populationInput.setAttribute("aria-expanded", "false");
}

function showPopulationResults(populations) {
  elements.populationResults.replaceChildren();
  populations.forEach((population) => {
    const item = document.createElement("li");
    item.role = "none";
    const option = document.createElement("button");
    option.type = "button";
    option.role = "option";
    option.className = "population-option";
    const placeName = [population.name, population.region].filter(Boolean).join(", ");
    option.textContent = placeName;
    option.addEventListener("click", () => {
      elements.populationInput.value = population.name;
      closePopulationResults();
      elements.populationStatus.textContent = "";
      map.focusLocation(population.latitude, population.longitude);
      selectLocation(population.latitude, population.longitude, placeName);
    });
    item.append(option);
    elements.populationResults.append(item);
  });
  elements.populationResults.hidden = populations.length === 0;
  elements.populationInput.setAttribute("aria-expanded", String(populations.length > 0));
}

async function findPopulations(query, requestId) {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) {
    closePopulationResults();
    elements.populationStatus.textContent = "Escribe al menos dos letras.";
    return;
  }

  elements.populationStatus.textContent = "Buscando poblaciones...";
  try {
    const populations = await searchPopulations(normalizedQuery);
    if (requestId !== populationRequest) return;
    showPopulationResults(populations);
    elements.populationStatus.textContent = populations.length
      ? ""
      : "No se encontraron poblaciones en España.";
  } catch (error) {
    if (requestId !== populationRequest) return;
    closePopulationResults();
    elements.populationStatus.textContent = error.message || "No se pudo realizar la búsqueda.";
  }
}

function schedulePopulationSearch(query) {
  window.clearTimeout(populationTimer);
  const requestId = ++populationRequest;
  if (query.trim().length < 2) {
    closePopulationResults();
    elements.populationStatus.textContent = "";
    return;
  }
  populationTimer = window.setTimeout(() => findPopulations(query, requestId), 300);
}

elements.populationInput.addEventListener("input", (event) => {
  schedulePopulationSearch(event.currentTarget.value);
});

elements.populationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  window.clearTimeout(populationTimer);
  const requestId = ++populationRequest;
  findPopulations(elements.populationInput.value, requestId);
});

elements.populationInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closePopulationResults();
  if (event.key === "ArrowDown" && !elements.populationResults.hidden) {
    event.preventDefault();
    elements.populationResults.querySelector("button")?.focus();
  }
});

document.addEventListener("click", (event) => {
  if (!elements.populationForm.contains(event.target)) closePopulationResults();
});

elements.speciesSelect.addEventListener("change", (event) => {
  selectedProfile = SPECIES_PROFILES.find(({ id }) => id === event.currentTarget.value) ?? SPECIES_PROFILES[0];
  renderSpeciesProfile(selectedProfile);
  if (selectedLocation?.daily?.length) renderLocation(selectedLocation);
});

elements.forecastHorizon.addEventListener("change", (event) => {
  setForecastHorizon(Number(event.currentTarget.value));
});

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
    const locations = await getRainfallForLocations(stations, 28);
    map.setStationData(locations);
    updateStationStatus(`${locations.length} estaciones de referencia · zoom ${mapZoom}`);
  } catch (error) {
    updateStationStatus("Estaciones sin datos · consulta un punto");
    console.error("No se pudieron cargar las estaciones de lluvia:", error);
  }
}

setPeriod(selectedDays);
loadStations();
