export const SPECIES_PROFILES = [
  {
    id: "general",
    name: "Setas generales",
    commonName: "Orientación general",
    scientificName: "Grupos diversos",
    rainfall: { minimum: 25, ideal: 55, maximum: 100, referenceDays: 21 },
    temperature: { minimum: 8, maximum: 20 },
    habitat: "Muy variable según la especie: bosques, praderas y suelos distintos.",
    season: "Depende de la especie, la altitud y el clima local.",
    note: "No existe un rango único válido para todas las setas."
  },
  {
    id: "robellon",
    name: "Robellón / Níscalo",
    commonName: "Níscalo",
    scientificName: "Lactarius deliciosus",
    rainfall: { minimum: 30, ideal: 65, maximum: 120, referenceDays: 21 },
    temperature: { minimum: 8, maximum: 18 },
    habitat: "Pinares (género Pinus), en suelos preferentemente ácidos o silíceos y bien drenados.",
    season: "Otoño e inicio del invierno; varía con la región y la altitud.",
    note: "La asociación con pinos es esencial; la lluvia por sí sola no confirma su presencia."
  }
];
