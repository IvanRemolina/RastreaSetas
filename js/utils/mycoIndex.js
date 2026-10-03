const LEVELS = [
  { limit: 20, label: "Baja" },
  { limit: 40, label: "Media" },
  { limit: 70, label: "Alta" },
  { limit: 101, label: "Excelente" }
];

function scoreRainfall(amount, thresholds) {
  if (amount < thresholds.minimum) return 35 * (amount / thresholds.minimum);
  if (amount <= thresholds.ideal) {
    return 35 + (amount - thresholds.minimum) / (thresholds.ideal - thresholds.minimum) * 65;
  }
  if (amount <= thresholds.maximum) {
    return 100 - (amount - thresholds.ideal) / (thresholds.maximum - thresholds.ideal) * 25;
  }
  return Math.max(0, 75 * thresholds.maximum / amount);
}

function scoreTemperature(temperature, range) {
  if (temperature >= range.minimum && temperature <= range.maximum) return 100;
  const distance = temperature < range.minimum
    ? range.minimum - temperature
    : temperature - range.maximum;
  return Math.max(0, 100 - distance * 14);
}

export function calculateMycoIndex(daily, days, profile) {
  const recentDays = daily.slice(-days);
  const validValues = recentDays
    .map(({ precipitation }) => precipitation)
    .filter((value) => Number.isFinite(value));

  if (validValues.length === 0) return null;

  const total = validValues.reduce((sum, value) => sum + value, 0);
  const coverage = validValues.length / days;
  const estimatedReferenceRainfall = total / validValues.length * profile.rainfall.referenceDays;
  const rainfallScore = scoreRainfall(estimatedReferenceRainfall, profile.rainfall);
  const temperatures = recentDays
    .map(({ temperature }) => temperature)
    .filter((value) => Number.isFinite(value));
  const meanTemperature = temperatures.length
    ? temperatures.reduce((sum, value) => sum + value, 0) / temperatures.length
    : null;
  const temperatureScore = meanTemperature === null
    ? null
    : scoreTemperature(meanTemperature, profile.temperature);
  const combinedScore = temperatureScore === null
    ? rainfallScore
    : rainfallScore * 0.65 + temperatureScore * 0.35;
  const score = Math.round(Math.min(100, combinedScore) * coverage);
  const level = LEVELS.find(({ limit }) => score < limit) ?? LEVELS.at(-1);

  return {
    score,
    label: level.label,
    coverage,
    estimatedReferenceRainfall,
    meanTemperature,
    note: temperatureScore === null
      ? "Estimación basada en precipitación; no hay temperatura disponible para completar el índice."
      : "Estimación orientativa con precipitación y temperatura; no incluye suelo ni presencia del hábitat adecuado."
  };
}
