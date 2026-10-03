const FACTOR_WEIGHTS = {
  rainfall: 0.33,
  incubation: 0.27,
  temperature: 0.18,
  humidity: 0.10,
  wind: 0.06,
  thermalShock: 0.06,
  continuity: 0.05
};

function getLevel(probability) {
  if (probability < 20) return "Muy baja";
  if (probability < 40) return "Baja";
  if (probability < 60) return "Media";
  if (probability < 80) return "Alta";
  return "Muy alta";
}

function scoreRainfall(amount, thresholds) {
  if (amount < thresholds.minimum) return amount / thresholds.minimum * 55;
  if (amount < thresholds.ideal) {
    return 55 + (amount - thresholds.minimum) / (thresholds.ideal - thresholds.minimum) * 45;
  }
  if (amount <= thresholds.maximum) {
    return 100 - (amount - thresholds.ideal) / (thresholds.maximum - thresholds.ideal) * 30;
  }
  return Math.max(0, 70 * thresholds.maximum / amount);
}

function scoreRange(value, range) {
  if (!Number.isFinite(value)) return null;
  if (value >= range.minimum && value <= range.maximum) return 100;
  const distance = value < range.minimum ? range.minimum - value : value - range.maximum;
  return Math.max(0, 100 - distance * 14);
}

function scoreHumidity(humidity, profile) {
  if (!Number.isFinite(humidity)) return null;
  if (humidity >= profile.idealHumidity) return 100;
  if (humidity <= profile.humidityMinimum) return humidity / profile.humidityMinimum * 45;
  return 45 + (humidity - profile.humidityMinimum) /
    (profile.idealHumidity - profile.humidityMinimum) * 55;
}

function scoreWind(wind, profile) {
  if (!Number.isFinite(wind)) return null;
  return Math.max(0, 100 - Math.max(0, wind - 10) / (profile.maximumWind - 10) * 100);
}

function scoreContinuity(rainfallWindow) {
  const amounts = rainfallWindow.map(({ precipitation }) => precipitation).filter(Number.isFinite);
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  if (!total) return 0;
  const wetDays = amounts.filter((amount) => amount >= 1).length;
  const wetDayScore = Math.min(100, wetDays * 20);
  const largestDayShare = Math.max(...amounts) / total;
  const spreadScore = Math.max(0, 100 - largestDayShare * 100);
  return wetDayScore * 0.7 + spreadScore * 0.3;
}

function average(rows, property) {
  const values = rows.map((row) => row[property]).filter(Number.isFinite);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function scoreThermalShock(daily, targetIndex, threshold) {
  const recentMean = average(daily.slice(targetIndex - 2, targetIndex + 1), "minimumTemperature");
  const earlierMean = average(daily.slice(targetIndex - 5, targetIndex - 2), "minimumTemperature");
  if (recentMean === null || earlierMean === null) return null;
  const temperatureDrop = earlierMean - recentMean;
  if (temperatureDrop >= threshold) return 100;
  if (temperatureDrop > 0) return 45 + temperatureDrop / threshold * 55;
  return 40;
}

function evaluateTargetWeather(row, daily, targetIndex, profile) {
  if (Number.isFinite(row.minimumTemperature) && row.minimumTemperature <= 0) {
    return { score: 0, factors: { frost: true } };
  }

  const meanTemperatureScore = scoreRange(row.temperature, profile.temperature.mean);
  const nightTemperatureScore = scoreRange(row.minimumTemperature, profile.temperature.night);
  const temperatureScore = meanTemperatureScore === null
    ? nightTemperatureScore
    : nightTemperatureScore === null
      ? meanTemperatureScore
      : meanTemperatureScore * 0.7 + nightTemperatureScore * 0.3;
  const factors = {
    temperature: temperatureScore,
    humidity: scoreHumidity(row.humidity, profile),
    wind: scoreWind(row.wind, profile),
    thermalShock: scoreThermalShock(daily, targetIndex, profile.thermalShockDrop)
  };
  return { factors };
}

export function estimateFruitingProbability(daily, targetDate, profile) {
  const targetIndex = daily.findIndex(({ date }) => date === targetDate);
  if (targetIndex < 0) return null;

  const targetWeather = evaluateTargetWeather(daily[targetIndex], daily, targetIndex, profile);
  if (targetWeather.factors?.frost) {
    return { probability: 0, label: "Muy baja", reason: "La previsión incluye helada; se penaliza la fructificación." };
  }

  const firstTrigger = Math.max(
    profile.rainfall.windowDays - 1,
    targetIndex - profile.incubation.maximum
  );
  const lastTrigger = targetIndex - profile.incubation.minimum;
  let best = null;

  for (let triggerIndex = firstTrigger; triggerIndex <= lastTrigger; triggerIndex += 1) {
    const rainfallWindow = daily.slice(triggerIndex - profile.rainfall.windowDays + 1, triggerIndex + 1);
    const amounts = rainfallWindow.map(({ precipitation }) => precipitation).filter(Number.isFinite);
    if (amounts.length < Math.ceil(profile.rainfall.windowDays * 0.8)) continue;

    const rainfall = amounts.reduce((sum, amount) => sum + amount, 0);
    if (rainfall < profile.rainfall.minimum) continue;

    const incubationDays = targetIndex - triggerIndex;
    const incubationMidpoint = (profile.incubation.minimum + profile.incubation.maximum) / 2;
    const incubationHalfRange = Math.max(1, (profile.incubation.maximum - profile.incubation.minimum) / 2);
    const incubationScore = Math.max(65, 100 - Math.abs(incubationDays - incubationMidpoint) / incubationHalfRange * 35);
    const factors = {
      rainfall: scoreRainfall(rainfall, profile.rainfall),
      continuity: scoreContinuity(rainfallWindow),
      incubation: incubationScore,
      ...targetWeather.factors
    };
    const availableFactors = Object.entries(factors).filter(([, value]) => Number.isFinite(value));
    const availableWeight = availableFactors.reduce((sum, [name]) => sum + FACTOR_WEIGHTS[name], 0);
    const probability = availableFactors.reduce(
      (sum, [name, value]) => sum + value * FACTOR_WEIGHTS[name],
      0
    ) / availableWeight;

    if (!best || probability > best.probability) {
      best = {
        probability: Math.round(probability),
        label: getLevel(probability),
        triggerDate: daily[triggerIndex].date,
        rainfall: Math.round(rainfall * 10) / 10,
        incubationDays,
        factors,
        reason: "Calculado con lluvia desencadenante, incubación y tiempo previsto."
      };
    }
  }

  return best ?? {
    probability: 0,
    label: "Muy baja",
    factors: {},
    reason: `No se detecta lluvia desencadenante suficiente dentro de la ventana de incubación (${profile.incubation.minimum}–${profile.incubation.maximum} días).`
  };
}
