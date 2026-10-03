const EARTH_MEAN_RADIUS_KM = 6371.0088;

export function calculateDistanceKm(latitudeA, longitudeA, latitudeB, longitudeB) {
  const coordinates = [latitudeA, longitudeA, latitudeB, longitudeB];
  if (!coordinates.every(Number.isFinite)) {
    throw new TypeError("Las coordenadas deben ser números finitos.");
  }

  const toRadians = (degrees) => degrees * Math.PI / 180;
  const latitudeDelta = toRadians(latitudeB - latitudeA);
  const longitudeDelta = toRadians(longitudeB - longitudeA);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(latitudeA)) * Math.cos(toRadians(latitudeB))
    * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_MEAN_RADIUS_KM * Math.asin(Math.sqrt(haversine));
}
