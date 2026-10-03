const REFERENCE_POINTS = [
  { name: "Pirineos", latitude: 42.65, longitude: 0.58 },
  { name: "Pirineos", latitude: 42.53, longitude: 1.45 },
  { name: "Pirineos", latitude: 42.39, longitude: -0.13 },
  { name: "Cordillera Cantábrica", latitude: 43.14, longitude: -4.85 },
  { name: "Cordillera Cantábrica", latitude: 43.02, longitude: -3.45 },
  { name: "Cordillera Cantábrica", latitude: 42.91, longitude: -5.9 },
  { name: "Sistema Central", latitude: 40.86, longitude: -4.02 },
  { name: "Sistema Central", latitude: 40.29, longitude: -5.2 },
  { name: "Sistema Central", latitude: 40.97, longitude: -3.77 },
  { name: "Sistema Ibérico", latitude: 41.79, longitude: -1.84 },
  { name: "Sistema Ibérico", latitude: 40.57, longitude: -1.1 },
  { name: "Sistema Ibérico", latitude: 40.12, longitude: -2.08 },
  { name: "Sierra Morena", latitude: 38.12, longitude: -4.9 },
  { name: "Sierra Morena", latitude: 38.21, longitude: -5.4 },
  { name: "Sierra Morena", latitude: 38.05, longitude: -3.75 },
  { name: "Sierras de Cazorla", latitude: 37.93, longitude: -2.92 },
  { name: "Sierras de Cazorla", latitude: 37.78, longitude: -2.99 },
  { name: "Sierras de Cazorla", latitude: 38.04, longitude: -2.71 }
];

function markerStyle(amount, opacity) {
  const validAmount = Number.isFinite(amount) ? amount : 0;
  const color = validAmount < 5 ? "#d5a13b" : validAmount < 20 ? "#90a46a" : "#397b68";
  return {
    radius: Math.min(15, 6 + Math.sqrt(validAmount) * 1.15),
    color: "#fffdf4",
    weight: 1.5,
    fillColor: color,
    fillOpacity: opacity,
    opacity: Math.min(1, opacity + 0.12),
    className: "rain-marker"
  };
}

export function createRainLayer() {
  const layer = L.layerGroup();
  let locations = [];
  let days = 14;
  let opacity = 0.78;

  function redraw() {
    layer.clearLayers();
    locations.forEach((location, index) => {
      const values = (location.daily ?? []).slice(-days)
        .map(({ precipitation }) => precipitation)
        .filter(Number.isFinite);
      const total = values.reduce((sum, value) => sum + value, 0);
      const marker = L.circleMarker([location.latitude, location.longitude], markerStyle(total, opacity));
      marker.bindTooltip(`${REFERENCE_POINTS[index].name} · ${total.toFixed(1)} mm / ${days} días`, { direction: "top", offset: [0, -5] });
      marker.addTo(layer);
    });
  }

  return {
    layer,
    setLocations(nextLocations) {
      locations = nextLocations;
      redraw();
    },
    setPeriod(nextDays) {
      days = nextDays;
      redraw();
    },
    setOpacity(nextOpacity) {
      opacity = nextOpacity;
      redraw();
    },
    getReferencePoints() {
      return REFERENCE_POINTS;
    }
  };
}
