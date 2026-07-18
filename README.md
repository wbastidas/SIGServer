# Visor Geoespacial Web — Redes Eléctricas

Aplicación web modular para consulta, análisis y edición ligera de información
geográfica de redes eléctricas que consume **exclusivamente servicios de ArcGIS
Server** (MapServer / FeatureServer / GPServer). **No requiere licencias más allá
de ArcGIS Server**: no depende de ArcGIS Online ni de ArcGIS Enterprise Portal.

Construida con **React 18 + TypeScript + Vite**, **ArcGIS Maps SDK for JavaScript**
(componentes web, no widgets) y **Calcite Design System**. Diseñada para
desplegarse como sitio estático en **IIS**.

> Implementa la SRS v1.0 (Julio 2026). La matriz de trazabilidad completa está al
> final de este documento.

---

## 1. Requisitos previos

- Node.js 18+ y npm.
- Acceso de red (o vía proxy) a los servicios de ArcGIS Server:
  - Cartografía base: `…/REP/CartografiaN/MapServer`
  - Redes eléctricas: `…/REP/CNELEPN/MapServer`
- (Opcional) Servicio de impresión `…/Utilities/PrintingTools/GPServer/Export Web Map Task`.
- (Opcional) Clave de Google Maps JS API para Street View.

> **CORS:** el ArcGIS Server debe permitir el origen del visor, o bien publicarse
> el visor tras el mismo dominio / proxy (ver §5).

## 2. Puesta en marcha (desarrollo)

```bash
npm install
cp .env.example .env      # ajuste las variables si aplica
npm run dev               # http://localhost:5173
```

Login de arranque (modo demo): **admin / admin**.

## 3. Construcción y despliegue en IIS

```bash
npm run build             # genera dist/
```

1. Copie el contenido de `dist/` al directorio del sitio en IIS.
2. Copie `web.config` (incluido) a la raíz del sitio. Provee:
   - **URL Rewrite** con fallback SPA a `index.html` (RNF-IIS-01).
   - MIME types para `.wasm`, `.json`, módulos ES (RNF-IIS-02).
   - Compresión y política de caché (RNF-IIS-04); la config JSON no se cachea
     para permitir recarga sin recompilar (RNF-CFG-03).
   - Cabeceras de seguridad: HSTS, X-Frame-Options, etc. (RNF-SEC-04).
3. Requisitos del servidor: módulo **URL Rewrite**; si usa el backend/proxy,
   también **Application Request Routing (ARR)** con proxy habilitado.

Los assets del SDK de ArcGIS y de Calcite se **copian localmente** al `dist/`
(no se usa CDN), para un despliegue 100% autocontenido y offline.

### 3.1 Scripts y calidad

```bash
npm run typecheck   # TypeScript sin emitir
npm run lint        # ESLint
npm test            # Pruebas unitarias (Vitest) de la logica pura
npm run build       # Build de produccion
```

Hay integración continua en `.github/workflows/ci.yml` que ejecuta typecheck,
lint, pruebas y build en cada push/PR a `main`.

## 4. Configuración externa (sin recompilar)

Toda URL de servicio, capa, campo, SR, plantilla y búsqueda vive en JSON externo
en `public/config/` (→ `dist/config/`). Puede editarse en el servidor y recargarse
sin reconstruir la app (RNF-CFG-01/03).

| Archivo | Contenido |
|---|---|
| `app-config.json` | Mapa base, servicio operacional, SR (WKID), filtros, impresión, Street View, auth. |
| `searches.json` | Búsquedas configurables (directas y relacionadas). |
| `popups.json` | Popups por capa: campos, alias, relacionados, Street View. |

Puntos a **validar con infraestructura** antes de producción (SRS §10):

1. `map.basemapType`: `tiled` (caché → rápido) vs `dynamic` (export → con latencia).
2. Existencia y acceso del servicio de impresión (`print.printServiceUrl`).
3. Definición de relaciones (`relationshipId`) en el MapServer; si no existen se
   usa *join* por campo llave.
4. IDs reales de subcapas (p. ej. el ID de "Punto de Carga" en `searches.json`).
5. Si los servicios ArcGIS requieren token → active `auth.arcgisServerSecured` y
   el backend/proxy (§5).
6. Clave y facturación de Google Maps para Street View.

### 4.1 SR configurable

`map.spatialReferenceWkid` fija el SR del mapa. La navegación por XY usa ese SR;
la de Lat/Long (4326) se **reproyecta** con el motor de proyección del SDK.

### 4.2 Añadir una búsqueda nueva

Agregue un objeto a `searches.json` (ver esquema en el propio archivo) y recargue.
No requiere recompilar (RF-SRC-06). Modos soportados:

- `type: "layer"` — búsqueda por atributo con `LIKE` insensible a mayúsculas.
- `type: "relatedTable"` — busca en una tabla y ubica el elemento espacial
  relacionado por `relationshipId` (`queryRelatedFeatures`) o por `join` de campo llave.

## 5. Backend de autenticación / token broker (opcional pero recomendado)

`server/authServer.mjs` es una referencia mínima **sin dependencias npm** (solo
módulos nativos de Node). Provee:

- `POST /login` — valida credenciales (scrypt hash) y emite un **JWT** propio.
- `GET /arcgis-token` — **token broker**: obtiene un token del ArcGIS Server con
  credenciales guardadas en el servidor y lo devuelve al cliente autenticado; las
  credenciales del servidor **nunca** llegan al navegador (RNF-SEC-03, RF-AUTH-05).

```bash
npm run server            # escucha en :4000 (configurable con AUTH_PORT)
```

Para activarlo en el frontend, defina `auth.apiBaseUrl` en `app-config.json`
(o `VITE_AUTH_API_URL` en `.env`). Publíquelo tras IIS con ARR + URL Rewrite
(hay una regla comentada en `web.config`, ruta `/sig-api/*`).

**Evolución de la autenticación** (SRS §8): Fase 0 `admin/admin` (demo) →
Fase 1 BD + JWT (este backend) → Fase 2 AD/LDAP → Fase 3 token broker. La
arquitectura permite sustituir el proveedor sin reescribir el frontend
(RF-AUTH-04): solo cambia `authService`/backend.

## 6. Variables de entorno

Ver `.env.example`. Las del frontend llevan prefijo `VITE_`. Las credenciales del
ArcGIS Server y el `JWT_SECRET` son **solo del backend** y no entran al bundle del
cliente (RNF-SEC-05).

## 7. Arquitectura y modularidad

- **Store central** (Zustand): `useMapStore` expone `MapView`/`Map` y estado
  compartido; `useConfigStore`, `useAuthStore`, `useStreetViewStore`.
- Cada herramienta es un **componente React independiente y desacoplado**
  (`src/components/panels/…`). Agregar o quitar una herramienta no obliga a tocar
  otras (RF-ARQ-01). Para añadir una, cree el componente y agréguelo al arreglo
  `TOOLS` de `AppShell.tsx`.
- **Componentes web del SDK** (no widgets deprecados): `arcgis-zoom`,
  `arcgis-locate`, `arcgis-layer-list`, `arcgis-legend`, `arcgis-sketch`,
  `arcgis-print`, `arcgis-*-measurement-2d`, enlazados al `MapView` vía la
  propiedad `.view` (hook `useBindView`).

```
src/
  components/  auth · map · layout · panels · common
  services/    mapFactory · searchService · selectionService · projectionService
               highlightService · popupTemplateFactory · authService · arcgisTokenService
               googleStreetView
  store/       useMapStore · useConfigStore · useAuthStore · useStreetViewStore
  config/      configLoader
  types/       config · auth · globals
server/        authServer.mjs (backend de referencia)
public/config/ app-config.json · searches.json · popups.json
```

## 8. Rendimiento (RNF-PERF)

- Recomendado **basemap teselado** (`tiled`) para zoom/paneo fluido.
- `FeatureLayer` para capas con mucha interacción (selección/consulta) y
  `MapImageLayer` para capas densas/baja interacción (`map.operationalMode`).
- Code-splitting por vendor (ArcGIS, Calcite, React) en el build.
- Consultas con límites (`num`) y paginación para no saturar el navegador.

## 9. Matriz de trazabilidad (requerimiento → implementación)

| Requerimiento | Dónde |
|---|---|
| RF-AUTH-01..05 | `authService`, `useAuthStore`, `LoginPage`, `AuthGate`, `arcgisTokenService`, `server/authServer.mjs` |
| RF-MAP-01/02/03 | `mapFactory` (TileLayer/MapImageLayer/FeatureLayer), `MapContainer` (SR) |
| RF-MAP-04/05 | `MapControls` (`arcgis-zoom`, `arcgis-locate`) |
| RF-LYR-01..04 | `LayerListPanel` (`arcgis-layer-list`, opacidad, `arcgis-legend`), visibilidad inicial en `mapFactory` |
| RF-SRC-01..07 | `searchService`, `SearchPanel`, `searches.json` |
| RF-FIL-01..05 | `FilterPanel` (definitionExpression / featureEffect) |
| RF-DRW-01..04 | `DrawTools` (`arcgis-sketch`, GraphicsLayer dedicado) |
| RF-MSR-01..03 | `MeasureTools` (`arcgis-*-measurement-2d`) |
| RF-GOTO-01..04 | `GoToXYPanel`, `projectionService`, `CoordinateConversion` (`arcgis-coordinate-conversion`) |
| RF-SEL-01..05 | `SelectionTable`, `selectionService`, `highlightService` (CSV incluido) |
| RF-POP-01..04 | `popupTemplateFactory`, `popups.json` (relacionados + acción Street View) |
| RF-GSV-01..04 | `StreetViewPanel`, `googleStreetView`, `useStreetViewStore` |
| RF-PRT-01..04 | `PrintPanel` (`arcgis-print`) |
| RF-ARQ-01 | Store central + paneles desacoplados |
| RNF-UX-01 | Tema claro/oscuro con conmutador (`useUiStore`, botón en la barra de navegación) |
| RNF-UX-04 | i18n preparado (`src/i18n/`, hook `useI18n`, diccionario es-EC) |
| RNF-PERF / SEC / CFG / IIS | Ver §8, §5, Calcite, `configLoader`, `web.config` |

## 10. Fuera de alcance (versión inicial)

Edición avanzada de geometría en producción, sincronización offline, y flujos que
requieran Portal/AGOL. Contemplados como fases futuras (SRS §1).

## 11. Nota sobre la versión del SDK

El código usa la API modular (`@arcgis/core`) y los **componentes web**
(`@arcgis/map-components`), patrón recomendado desde el SDK 5.x (los widgets
quedaron deprecados y se eliminan en 6.0). Los nombres de componentes y clases
usados son estables entre 4.3x y 5.x. Para fijar exactamente la versión 5.1,
actualice los rangos en `package.json` a las versiones publicadas de esos paquetes
y reejecute `npm install`.
