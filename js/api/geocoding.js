const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

export async function searchPopulations(query) {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) return [];

  const params = new URLSearchParams({
    name: normalizedQuery,
    count: "12",
    language: "es",
    format: "json"
  });
  const response = await fetch(`${GEOCODING_URL}?${params}`);
  if (!response.ok) throw new Error(`El buscador respondió con el estado ${response.status}.`);

  const payload = await response.json();
  return (payload.results ?? [])
    .filter((place) => place.country_code === "ES")
    .map((place) => ({
      id: place.id,
      name: place.name,
      region: place.admin1,
      province: place.admin2,
      latitude: place.latitude,
      longitude: place.longitude
    }));
}
