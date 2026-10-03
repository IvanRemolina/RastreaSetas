import { createRainLayer } from "./heatLayer.js";

export function initializeMap({ onMapClick, onZoom }) {
  const map = L.map("map", { zoomControl: false }).setView([40.4167, -3.7037], 6);
  const topographic = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  });
  const satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 19,
    attribution: "Tiles &copy; Esri · Sources: Esri, Maxar, Earthstar Geographics, and the GIS User Community"
  });

  topographic.addTo(map);
  L.control.zoom({ position: "topright" }).addTo(map);
  L.control.layers({ "Topográfica · OpenStreetMap": topographic, "Satélite · Esri": satellite }, null, { position: "topright" }).addTo(map);

  const rain = createRainLayer();
  rain.layer.addTo(map);
  const selectedPoint = L.circleMarker([40.4167, -3.7037], {
    radius: 8,
    color: "#fff",
    weight: 3,
    fillColor: "#b78636",
    fillOpacity: 1
  });

  map.on("click", (event) => {
    selectedPoint.setLatLng(event.latlng).addTo(map);
    onMapClick(event.latlng.lat, event.latlng.lng);
  });
  map.on("zoomend", () => onZoom(map.getZoom()));

  return {
    rain,
    getStations: () => rain.getStations(),
    setStationData: (locations) => rain.setLocations(locations),
    setPeriod: (days) => rain.setPeriod(days),
    setOpacity: (opacity) => rain.setOpacity(opacity)
  };
}
