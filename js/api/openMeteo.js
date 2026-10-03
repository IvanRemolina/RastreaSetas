const API_URL = "https://archive-api.open-meteo.com/v1/archive";
const DAY_MS = 24 * 60 * 60 * 1000;

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
      precipitation: response.daily.precipitation_sum[dayIndex]
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
  if (![3, 7, 14].includes(days)) throw new RangeError("El periodo debe ser de 3, 7 o 14 días.");

  const { startDate, endDate } = getDateRange(days);
  const query = new URLSearchParams({
    latitude: coordinates.map(({ latitude }) => latitude).join(","),
    longitude: coordinates.map(({ longitude }) => longitude).join(","),
    start_date: startDate,
    end_date: endDate,
    daily: "precipitation_sum",
    timezone: "Europe/Madrid"
  });

  const response = await fetch(`${API_URL}?${query}`);
  if (!response.ok) throw new Error(`Open-Meteo respondió con el estado ${response.status}.`);
  return normalizeResponse(await response.json(), coordinates);
}

export async function getRainfall(latitude, longitude, days = 14) {
  const [result] = await getRainfallForLocations([{ latitude, longitude }], days);
  return result;
}
