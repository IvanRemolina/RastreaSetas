const commonFactors = {
  humidityMinimum: 80,
  idealHumidity: 85,
  maximumWind: 35,
  thermalShockDrop: 5
};

export const SPECIES_PROFILES = [
  {
    id: "general",
    name: "Setas generales",
    scientificName: "Orientación general",
    rainfall: { minimum: 30, ideal: 45, maximum: 100, windowDays: 14 },
    incubation: { minimum: 10, maximum: 18 },
    temperature: { mean: { minimum: 10, maximum: 20 }, night: { minimum: 4, maximum: 14 } },
    ...commonFactors,
    habitat: "Variable: depende de la especie, el árbol asociado, el suelo y la orientación.",
    season: "Depende de la especie, la altitud y las condiciones locales.",
    note: "No existe un rango único válido para todas las setas."
  },
  {
    id: "boletus-edulis",
    name: "Boletus edulis",
    scientificName: "Hongo blanco / Miguel",
    rainfall: { minimum: 40, ideal: 50, maximum: 90, windowDays: 14 },
    incubation: { minimum: 12, maximum: 18 },
    temperature: { mean: { minimum: 10, maximum: 14 }, night: { minimum: 4, maximum: 8 } },
    ...commonFactors,
    habitat: "Pinares, robledales, hayedos y castañares; asociación micorrícica con árboles.",
    season: "Principalmente otoño, variable con altitud y región.",
    note: "El perfil usa rangos orientativos; la presencia de árboles hospedadores no se comprueba en el mapa."
  },
  {
    id: "boletus-aereus",
    name: "Boletus aereus",
    scientificName: "Hongo negro",
    rainfall: { minimum: 30, ideal: 40, maximum: 80, windowDays: 14 },
    incubation: { minimum: 10, maximum: 14 },
    temperature: { mean: { minimum: 16, maximum: 20 }, night: { minimum: 10, maximum: 14 } },
    ...commonFactors,
    habitat: "Robledales, alcornocales y encinares de clima templado o cálido.",
    season: "Final de verano y otoño, según lluvias y región.",
    note: "Los árboles asociados y el estado real del suelo son determinantes."
  },
  {
    id: "robellon",
    name: "Robellón / Níscalo",
    scientificName: "Lactarius deliciosus",
    rainfall: { minimum: 35, ideal: 45, maximum: 85, windowDays: 14 },
    incubation: { minimum: 12, maximum: 20 },
    temperature: { mean: { minimum: 11, maximum: 17 }, night: { minimum: 4, maximum: 9 } },
    ...commonFactors,
    habitat: "Pinares; el suelo y la especie de pino varían entre regiones.",
    season: "Otoño e inicio del invierno, condicionado por altitud y clima local.",
    note: "Necesita pinos; la aplicación no dispone de un mapa de especies forestales."
  },
  {
    id: "cantharellus-cibarius",
    name: "Rebozuelo",
    scientificName: "Cantharellus cibarius",
    rainfall: { minimum: 50, ideal: 60, maximum: 100, windowDays: 14 },
    incubation: { minimum: 18, maximum: 25 },
    temperature: { mean: { minimum: 13, maximum: 17 }, night: { minimum: 6, maximum: 12 } },
    ...commonFactors,
    habitat: "Hayedos, robledales y castañares, según la zona.",
    season: "Verano y otoño húmedos, según la región.",
    note: "Las condiciones de sombra, suelo y bosque no están medidas por el modelo."
  },
  {
    id: "pleurotus-eryngii",
    name: "Seta de cardo",
    scientificName: "Pleurotus eryngii",
    rainfall: { minimum: 25, ideal: 35, maximum: 70, windowDays: 14 },
    incubation: { minimum: 8, maximum: 12 },
    temperature: { mean: { minimum: 12, maximum: 16 }, night: { minimum: 5, maximum: 11 } },
    ...commonFactors,
    habitat: "Prados y laderas con cardo corredor (Eryngium campestre).",
    season: "Otoño y primavera, con variación local.",
    note: "La presencia del cardo hospedador es imprescindible y no se verifica aquí."
  },
  {
    id: "macrolepiota-procera",
    name: "Parasol",
    scientificName: "Macrolepiota procera",
    rainfall: { minimum: 20, ideal: 30, maximum: 65, windowDays: 14 },
    incubation: { minimum: 5, maximum: 9 },
    temperature: { mean: { minimum: 14, maximum: 18 }, night: { minimum: 7, maximum: 13 } },
    ...commonFactors,
    habitat: "Claros de bosque, pastizales y bordes de caminos con suelo adecuado.",
    season: "Final de verano y otoño, según las lluvias.",
    note: "La lluvia y la temperatura no identifican por sí solas el hábitat."
  },
  {
    id: "amanita-caesarea",
    name: "Oronja",
    scientificName: "Amanita caesarea",
    rainfall: { minimum: 30, ideal: 40, maximum: 75, windowDays: 14 },
    incubation: { minimum: 10, maximum: 15 },
    temperature: { mean: { minimum: 18, maximum: 22 }, night: { minimum: 11, maximum: 16 } },
    ...commonFactors,
    habitat: "Castañares y bosques cálidos de robles, alcornoques o encinas.",
    season: "Verano tardío y otoño cálido, con fuerte variación regional.",
    note: "Especie protegida en algunas zonas; consulta siempre la normativa local."
  }
];
