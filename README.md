# Rastreasetas

Rastreasetas es una aplicación web estática para explorar la precipitación reciente en distintas zonas montañosas de España y consultar datos de lluvia por coordenadas. Está pensada como apoyo orientativo para aficionados a la micología; la lluvia por sí sola no permite determinar si hay setas.

**Despliegue:** `https://<tu-usuario>.github.io/rastreasetas/` (reemplaza el usuario después de publicar).

## Funcionalidades

- Mapa interactivo de España con fondos OpenStreetMap y Esri World Imagery.
- Estaciones de referencia en Pirineos, Cordillera Cantábrica, Sistema Central, Sistema Ibérico, Sierra Morena y Sierras de Cazorla.
- Selector de acumulación de 3, 7 o 14 días y control de opacidad de los datos.
- Consulta puntual al seleccionar una ubicación, con lluvia diaria e índice orientativo de aptitud micológica.
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
- **Open-Meteo Historical Weather API:** `https://archive-api.open-meteo.com/v1/archive`, variable diaria `precipitation_sum`, zona horaria `Europe/Madrid`. No requiere clave.

El API histórico puede publicar los datos recientes con varios días de demora. En ese caso la consulta puede no incluir los días más cercanos a hoy o devolver datos incompletos. La aplicación informa si no hay datos disponibles. El índice micológico es una heurística basada únicamente en precipitación, no incorpora temperatura, suelo, altitud, hábitat ni observaciones de campo y no debe interpretarse como garantía de encontrar setas.

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
    ├── api/openMeteo.js
    ├── map/
    │   ├── mapManager.js
    │   └── heatLayer.js
    └── utils/mycoIndex.js
```

## Prompt y mantenimiento

**Prompt de referencia:** «Crear Rastreasetas, una aplicación web cliente estática para GitHub Pages con Leaflet, que permita consultar la precipitación acumulada de los últimos 3, 7 y 14 días en zonas montañosas de España mediante Open-Meteo Historical Weather API y muestre el desglose diario y un índice orientativo de aptitud micológica. Usar HTML, CSS y JavaScript ES6+, rutas relativas y el logotipo proporcionado. Documentar el despliegue en GitHub Pages y las tecnologías utilizadas.»

**Pauta de actualización:** este README debe actualizarse siempre que se añadan funcionalidades, cambie el objetivo del proyecto, se modifiquen APIs o tecnologías relevantes, o cambie la URL de despliegue. Mantén también sincronizada la estructura descrita con los archivos reales.
