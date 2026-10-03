const LEVELS = [
  { limit: 10, label: "Baja", note: "Precipitación escasa para favorecer la humedad del suelo." },
  { limit: 30, label: "Media", note: "Lluvia moderada; las condiciones pueden variar mucho según el hábitat." },
  { limit: 60, label: "Alta", note: "La precipitación reciente puede favorecer ambientes húmedos." },
  { limit: 101, label: "Excelente", note: "Acumulación elevada; comprueba también temperatura y condiciones locales." }
];

export function calculateMycoIndex(daily, days) {
  const recentDays = daily.slice(-days);
  const validValues = recentDays
    .map(({ precipitation }) => precipitation)
    .filter((value) => Number.isFinite(value));

  if (validValues.length === 0) return null;

  const total = validValues.reduce((sum, value) => sum + value, 0);
  const coverage = validValues.length / days;
  const score = Math.round(Math.min(100, (total / days / 5) * 100) * coverage);
  const level = LEVELS.find(({ limit }) => score < limit) ?? LEVELS.at(-1);

  return { score, label: level.label, note: level.note, coverage };
}
