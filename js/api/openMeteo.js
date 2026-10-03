import { calculateDistanceKm } from "../utils/geo.js";

const API_URL = "https://archive-api.open-meteo.com/v1/archive";
const FORECAST_API_URL = "https://api.open-meteo.com/v1/forecast";
const DAY_MS = 24 * 60 * 60 * 1000;
const SUPPORTED_PERIODS = [3, 7, 14, 21, 28, 30];
const NEIGHBOR_RADIUS_KM = 10;
const EARTH_LATITUDE_KM_PER_DEGREE = 111.195;

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function getDateRange(days) {
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  end.setTime(end.getTime() - DAY_MS);
  const start = new Date(end.getTime() - (days - 1) * DAY_MS);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

function normalizeResponse(payload, coordinates) {
  const responses = Array.isArray(payload) ? payload : [payload];
  return responses.map((response, index) => {
    if (!response?.daily?.time || !response.daily.precipitation_sum) {
      throw new Error("Open-Meteo no devolvió datos diarios para esta ubicación.");
    }

    const daily = response.daily.time.map((date, dayIndex) => ({
      date,
      precipitation: response.daily.precipitation_sum[dayIndex],
      temperature: response.daily.temperature_2m_mean?.[dayIndex] ?? null,
      minimumTemperature: response.daily.temperature_2m_min?.[dayIndex] ?? null,
      humidity: response.daily.relative_humidity_2m_mean?.[dayIndex] ?? null,
      wind: response.daily.wind_speed_10m_max?.[dayIndex] ?? null
    }));

    return {
      latitude: response.latitude ?? coordinates[index]?.latitude,
      longitude: response.longitude ?? coordinates[index]?.longitude,
      daily
    };
  });
}

export async function getRainfallForLocations(coordinates, days = 14) {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return [];
  if (!SUPPORTED_PERIODS.includes(days)) throw new RangeError("El periodo debe ser de 3, 7, 14, 21, 28 o 30 días.");

  const { startDate, endDate } = getDateRange(days);
  const query = new URLSearchParams({
    latitude: coordinates.map(({ latitude }) => latitude).join(","),
    longitude: coordinates.map(({ longitude }) => longitude).join(","),
    start_date: startDate,
    end_date: endDate,
    daily: "precipitation_sum,temperature_2m_mean",
    timezone: "Europe/Madrid"
  });

  const response = await fetch(`${API_URL}?${query}`);
  if (!response.ok) throw new Error(`Open-Meteo respondió con el estado ${response.status}.`);
  return normalizeResponse(await response.json(), coordinates);
}

export async function getRainfall(latitude, longitude) {
  const [nearest] = await getNearbyRainfall(latitude, longitude);
  return nearest;
}

export async function getNearbyRainfall(latitude, longitude) {
  const latitudeOffset = NEIGHBOR_RADIUS_KM / EARTH_LATITUDE_KM_PER_DEGREE;
  const longitudeOffset = latitudeOffset / Math.cos(latitude * Math.PI / 180);
  const coordinates = [
    { latitude, longitude },
    { latitude: latitude + latitudeOffset, longitude },
    { latitude: latitude - latitudeOffset, longitude },
    { latitude, longitude: longitude + longitudeOffset },
    { latitude, longitude: longitude - longitudeOffset }
  ];
  const params = new URLSearchParams({
    latitude: coordinates.map((point) => point.latitude).join(","),
    longitude: coordinates.map((point) => point.longitude).join(","),
    past_days: "42",
    forecast_days: "16",
    daily: "precipitation_sum,temperature_2m_mean,temperature_2m_min,relative_humidity_2m_mean,wind_speed_10m_max",
    timezone: "Europe/Madrid"
  });
  const response = await fetch(`${FORECAST_API_URL}?${params}`);
  if (!response.ok) throw new Error(`Open-Meteo respondió con el estado ${response.status}.`);
  const results = normalizeResponse(await response.json(), coordinates);
  const uniqueGridPoints = new Map();
  results.forEach((result) => {
    const key = `${result.latitude.toFixed(5)},${result.longitude.toFixed(5)}`;
    if (!uniqueGridPoints.has(key)) uniqueGridPoints.set(key, result);
  });

  return [...uniqueGridPoints.values()]
    .map((point) => ({
      ...point,
      distanceKm: Math.round(calculateDistanceKm(latitude, longitude, point.latitude, point.longitude) * 10) / 10
    }))
    .sort((first, second) => first.distanceKm - second.distanceKm)
    .slice(0, 5);
}
