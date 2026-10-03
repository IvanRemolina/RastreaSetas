import { createRainLayer } from "./heatLayer.js";
import { createHabitatLayer } from "./habitatLayer.js";

export function initializeMap({ onMapClick, onZoom, onHabitatStatus }) {
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
  const habitat = createHabitatLayer(map, onHabitatStatus);
  const modelGridPoint = L.layerGroup();
  L.control.layers(
    { "Topográfica · OpenStreetMap": topographic, "Satélite · Esri": satellite },
    {
      "Coníferas · OSM (orientativo)": habitat,
      "Punto de rejilla Open-Meteo": modelGridPoint
    },
    { position: "topright" }
  ).addTo(map);

  const rain = createRainLayer();
  rain.layer.addTo(map);
  const selectedPoint = L.circleMarker([40.4167, -3.7037], {
    radius: 8,
    color: "#fff",
    weight: 3,
    fillColor: "#b78636",
    fillOpacity: 1
  });

  function selectPoint(latitude, longitude) {
    selectedPoint.setLatLng([latitude, longitude]).addTo(map);
  }

  function setModelGridPoint(selectedLatitude, selectedLongitude, gridLatitude, gridLongitude) {
    modelGridPoint.clearLayers();
    L.polyline([[selectedLatitude, selectedLongitude], [gridLatitude, gridLongitude]], {
      color: "#2475a5",
      weight: 2,
      dashArray: "4 6",
      interactive: false
    }).addTo(modelGridPoint);
    L.circleMarker([gridLatitude, gridLongitude], {
      radius: 7,
      color: "#fff",
      weight: 2,
      fillColor: "#2475a5",
      fillOpacity: 1
    }).bindTooltip("Punto de rejilla del modelo Open-Meteo; no es un pluviómetro.")
      .addTo(modelGridPoint);
  }

  map.on("click", (event) => {
    selectPoint(event.latlng.lat, event.latlng.lng);
    onMapClick(event.latlng.lat, event.latlng.lng);
  });
  map.on("zoomend", () => onZoom(map.getZoom()));

  return {
    rain,
    getReferencePoints: () => rain.getReferencePoints(),
    setReferenceData: (locations) => rain.setLocations(locations),
    setModelGridPoint,
    setPeriod: (days) => rain.setPeriod(days),
    setOpacity: (opacity) => rain.setOpacity(opacity),
    focusLocation(latitude, longitude) {
      map.setView([latitude, longitude], Math.max(map.getZoom(), 10));
      selectPoint(latitude, longitude);
    }
  };
}
