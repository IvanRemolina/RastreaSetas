const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter"
];
const MIN_ZOOM = 10;
const MAX_VIEW_AREA = 0.8;
const CACHE_LIMIT = 8;

export function createConiferFeatures(elements = []) {
  const features = elements.flatMap((element) => {
    if (element.type !== "way" || !Array.isArray(element.geometry) || element.geometry.length < 4) return [];
    const first = element.geometry[0];
    const last = element.geometry.at(-1);
    if (first.lat !== last.lat || first.lon !== last.lon) return [];

    return [{
      type: "Feature",
      id: element.id,
      properties: element.tags ?? {},
      geometry: {
        type: "Polygon",
        coordinates: [element.geometry.map(({ lat, lon }) => [lon, lat])]
      }
    }];
  });

  return { type: "FeatureCollection", features };
}

function createQuery(bounds) {
  const south = bounds.getSouth().toFixed(3);
  const west = bounds.getWest().toFixed(3);
  const north = bounds.getNorth().toFixed(3);
  const east = bounds.getEast().toFixed(3);
  const box = `(${south},${west},${north},${east})`;

  return `[out:json][timeout:18];(way["landuse"="forest"]["leaf_type"="needleleaved"]${box};way["landuse"="forest"]["wood"~"conifer"]${box};way["natural"="wood"]["leaf_type"="needleleaved"]${box};);out geom;`;
}

export function createHabitatLayer(map, onStatus = () => {}) {
  const layer = L.geoJSON([], {
    color: "#315a3b",
    weight: 1.2,
    fillColor: "#73986a",
    fillOpacity: 0.24,
    className: "conifer-habitat",
    onEachFeature(feature, featureLayer) {
      const description = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = feature.properties.name || "Bosque etiquetado como coníferas";
      const caveat = document.createElement("p");
      caveat.textContent = "Hábitat potencial según OpenStreetMap. No confirma la especie forestal, el acceso ni el permiso de recolección.";
      description.append(name, caveat);
      featureLayer.bindPopup(description);
    }
  });
  const cache = new Map();
  let active = false;
  let requestController = null;
  let requestTimer = null;
  let requestId = 0;

  map.attributionControl.addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> · hábitat colaborativo');

  function stopRequest() {
    window.clearTimeout(requestTimer);
    requestController?.abort();
    requestController = null;
  }

  function showCollection(collection) {
    layer.clearLayers();
    layer.addData(collection);
  }

  async function fetchCollection(query, signal) {
    let lastError = null;
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const url = `${endpoint}?${new URLSearchParams({ data: query })}`;
        const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error(`Overpass respondió ${response.status}.`);
        const payload = await response.json();
        if (!Array.isArray(payload.elements)) throw new Error("Respuesta de Overpass no válida.");
        return createConiferFeatures(payload.elements);
      } catch (error) {
        if (signal.aborted) throw error;
        lastError = error;
      }
    }
    throw lastError ?? new Error("No hay instancias de Overpass disponibles.");
  }

  async function loadVisibleArea() {
    if (!active) return;
    const bounds = map.getBounds();
    if (map.getZoom() < MIN_ZOOM) {
      showCollection({ type: "FeatureCollection", features: [] });
      onStatus(`Acerca el mapa al zoom ${MIN_ZOOM} para consultar bosques etiquetados.`);
      return;
    }

    const area = (bounds.getNorth() - bounds.getSouth()) * (bounds.getEast() - bounds.getWest());
    if (area > MAX_VIEW_AREA) {
      showCollection({ type: "FeatureCollection", features: [] });
      onStatus("Acerca un poco más el mapa para limitar la consulta de hábitat.");
      return;
    }

    const key = [bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()]
      .map((value) => value.toFixed(3))
      .join(",");
    const cached = cache.get(key);
    if (cached) {
      showCollection(cached);
      onStatus(cached.features.length
        ? `${cached.features.length} polígonos de coníferas etiquetados en OpenStreetMap.`
        : "No hay bosques de coníferas etiquetados en esta vista.");
      return;
    }

    stopRequest();
    requestController = new AbortController();
    const currentRequest = ++requestId;
    const controller = requestController;
    requestTimer = window.setTimeout(() => controller.abort(), 20000);
    onStatus("Consultando hábitat potencial en OpenStreetMap…");

    try {
      const collection = await fetchCollection(createQuery(bounds), controller.signal);
      if (!active || currentRequest !== requestId) return;
      cache.set(key, collection);
      if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);
      showCollection(collection);
      onStatus(collection.features.length
        ? `${collection.features.length} polígonos de coníferas etiquetados en OpenStreetMap.`
        : "No hay bosques de coníferas etiquetados en esta vista.");
    } catch (error) {
      if (!active || currentRequest !== requestId) return;
      showCollection({ type: "FeatureCollection", features: [] });
      onStatus(error.name === "AbortError"
        ? "La consulta de hábitat tardó demasiado; vuelve a mover el mapa para intentarlo."
        : "No se pudo consultar OpenStreetMap ahora. La capa de lluvia sigue disponible.");
    } finally {
      if (currentRequest === requestId) {
        window.clearTimeout(requestTimer);
        requestController = null;
      }
    }
  }

  function scheduleLoad() {
    if (!active) return;
    window.clearTimeout(requestTimer);
    requestTimer = window.setTimeout(loadVisibleArea, 500);
  }

  map.on("overlayadd", (event) => {
    if (event.layer !== layer) return;
    active = true;
    loadVisibleArea();
  });
  map.on("overlayremove", (event) => {
    if (event.layer !== layer) return;
    active = false;
    requestId += 1;
    stopRequest();
    onStatus("");
  });
  map.on("moveend", scheduleLoad);

  return layer;
}
