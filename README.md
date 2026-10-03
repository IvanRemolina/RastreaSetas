# Rastreasetas

Rastreasetas es una aplicación web estática para explorar la precipitación reciente en distintas zonas montañosas de España y consultar datos de lluvia por coordenadas. Está pensada como apoyo orientativo para aficionados a la micología; la lluvia por sí sola no permite determinar si hay setas.

**Despliegue:** `https://<tu-usuario>.github.io/rastreasetas/` (reemplaza el usuario después de publicar).

## Funcionalidades

- Mapa interactivo de España con fondos OpenStreetMap y Esri World Imagery.
- Estaciones de referencia en Pirineos, Cordillera Cantábrica, Sistema Central, Sistema Ibérico, Sierra Morena y Sierras de Cazorla.
- Selector de acumulación de 3, 7, 14, 21 y 28 días; 21 días queda seleccionado como referencia inicial.
- Buscador de poblaciones españolas y consulta puntual por coordenadas, con desglose diario de lluvia y temperatura.
- Perfiles editables para setas generales y robellones/níscalos, con rangos ambientales orientativos.
- Interfaz adaptable a móvil y escritorio, sin servidor ni proceso de compilación.

## Despliegue en GitHub Pages

1. Sube estos archivos a la rama principal de un repositorio llamado `rastreasetas`.
2. Abre el repositorio en GitHub y entra en **Settings > Pages**.
3. En **Build and deployment**, selecciona **Deploy from a branch**.
4. Elige la rama `main` y la carpeta `/(root)`, y pulsa **Save**.
5. Cuando termine la publicación, abre la URL que muestra GitHub Pages y actualiza el enlace de despliegue de este README con la dirección real.

Todos los recursos propios usan rutas relativas para funcionar tanto en la raíz como en el subdirectorio de GitHub Pages. Leaflet, las fuentes y el mapa base se cargan desde servicios externos; hace falta conexión a Internet.

## APIs y tecnologías

- **HTML5, CSS3 y JavaScript ES modules:** interfaz y lógica cliente.
- **Leaflet 1.9.4:** mapa, capas, eventos y marcadores circulares.
- **OpenStreetMap:** cartografía topográfica/callejera.
- **Esri World Imagery:** fondo de imágenes satelitales.
- **Open-Meteo Historical Weather API:** `https://archive-api.open-meteo.com/v1/archive`, variables diarias `precipitation_sum` y `temperature_2m_mean`, zona horaria `Europe/Madrid`. No requiere clave.
- **Open-Meteo Geocoding API:** `https://geocoding-api.open-meteo.com/v1/search`, para localizar poblaciones y centrar el mapa. No requiere clave.

El API histórico puede publicar los datos recientes con varios días de demora. En ese caso la consulta puede no incluir los días más cercanos a hoy o devolver datos incompletos. La aplicación informa si no hay datos disponibles. Los perfiles de especie se mantienen en `js/utils/speciesProfiles.js`; sus rangos son aproximados y deben revisarse con conocimiento micológico local. El índice combina precipitación y temperatura media cuando están disponibles, pero no conoce el suelo, la altitud, los árboles presentes ni las observaciones de campo; no predice ni garantiza la presencia de setas.

## Estructura

```text
.
├── README.md
├── index.html
├── assets/logo.png
├── css/
│   ├── main.css
│   └── components/
│       ├── map.css
│       └── sidebar.css
└── js/
    ├── app.js
    ├── api/
    │   ├── geocoding.js
    │   └── openMeteo.js
    ├── map/
    │   ├── mapManager.js
    │   └── heatLayer.js
    └── utils/
        ├── mycoIndex.js
        └── speciesProfiles.js
```

## Prompt y mantenimiento

**Prompt de referencia:** «Crear Rastreasetas, una aplicación web cliente estática para GitHub Pages con Leaflet, que permita consultar la precipitación acumulada en zonas montañosas de España en varios periodos (incluido el recomendado de 21 días), buscar poblaciones y mostrar condiciones orientativas configurables para distintas setas mediante perfiles separados. Usar Open-Meteo, HTML, CSS y JavaScript ES6+, rutas relativas y el logotipo proporcionado. Documentar despliegue, APIs y tecnologías.»

**Pauta de actualización:** este README debe actualizarse siempre que se añadan funcionalidades, cambie el objetivo del proyecto, se modifiquen APIs o tecnologías relevantes, o cambie la URL de despliegue. Mantén también sincronizada la estructura descrita con los archivos reales.
