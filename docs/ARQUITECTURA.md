# Arquitectura del Visor de Redes Eléctricas — Detalle de módulos

Documento de referencia para entender **todos los aspectos** del programa: qué hace,
cómo arranca, cómo fluyen los datos, y qué responsabilidad tiene cada archivo/módulo.

---

## 1. Visión general

Es una **SPA (Single Page Application)** en React + TypeScript que consume
**exclusivamente servicios de ArcGIS Server** (MapServer/FeatureServer/GPServer). No
usa ArcGIS Online ni Portal. Toda la parametrización (URLs, capas, campos, SR,
búsquedas, popups) vive en **archivos JSON externos** que se pueden editar sin
recompilar.

La aplicación se compone de tres capas:

```
┌──────────────────────────────────────────────────────────────┐
│  FRONTEND (SPA React)  — se sirve como sitio estático en IIS   │
│                                                                │
│  UI (Calcite + componentes web ArcGIS)                         │
│      ↓ leen/escriben                                           │
│  STORES (Zustand)  ← estado global compartido                  │
│      ↓ usan                                                    │
│  SERVICIOS (lógica pura + llamadas al SDK)                     │
│      ↓ consumen                                                │
│  CONFIG JSON (externa, /config/*.json)                         │
└──────────────────────────────────────────────────────────────┘
              │                                  │
              ▼                                  ▼
┌───────────────────────────┐      ┌────────────────────────────┐
│ BACKEND ligero (opcional) │      │ ArcGIS Server (existente)  │
│ auth JWT + token broker   │      │ MapServer / GPServer        │
│ server/authServer.mjs     │      │ geoportal.cnelep.gob.ec     │
└───────────────────────────┘      └────────────────────────────┘
```

### Flujo de arranque (qué ocurre al abrir la app)

1. `index.html` carga `src/main.tsx`.
2. `main.tsx` registra **Calcite** y los **componentes web del SDK**, y fija sus
   rutas de assets **locales** (sin CDN).
3. Renderiza `<App>`.
4. `App` dispara `useConfigStore.load()` → hace *fetch* de los 3 JSON de `/config`.
   Mientras carga, muestra un *loader*.
5. `App` restaura la sesión (si existe) y aplica el **tema** claro/oscuro.
6. `AuthGate` decide: si no hay sesión válida → `LoginPage`; si la hay → `AppShell`.
7. Al autenticar, `AppShell` monta el `MapContainer`, que crea el `Map`+`MapView`
   con el SDK y publica esas instancias en `useMapStore`.
8. A partir de ahí, cada herramienta (panel) lee el `MapView` del store y opera.

---

## 2. Estructura de carpetas

```
src/
├── main.tsx                 Punto de entrada; registra Calcite y componentes SDK
├── App.tsx                  Orquesta config, sesión, tema, guard de auth
├── config/
│   └── configLoader.ts      Carga y valida los JSON externos
├── types/
│   ├── config.ts            Tipos de toda la configuración
│   ├── auth.ts              Tipos de sesión/usuario
│   └── globals.d.ts         Declaración laxa de `google` (Street View)
├── store/                   Estado global (Zustand)
│   ├── useConfigStore.ts    Configuración cargada
│   ├── useAuthStore.ts      Sesión/login/logout
│   ├── useMapStore.ts       MapView/Map + herramienta activa + selección
│   ├── useUiStore.ts        Tema claro/oscuro
│   └── useStreetViewStore.ts Estado del panel flotante de Street View
├── services/                Lógica (pura + integración con el SDK)
│   ├── mapFactory.ts        Construye Map, basemap y capas desde config
│   ├── popupTemplateFactory.ts  Arma los PopupTemplate (atributos+relacionados+SV)
│   ├── searchService.ts     Búsquedas directas y relacionadas
│   ├── selectionService.ts  Selección espacial (clic/rectángulo/polígono)
│   ├── queryUtils.ts        Lógica PURA: WHERE, IN, CSV (con pruebas unitarias)
│   ├── projectionService.ts Reproyección Lat/Long ↔ SR del mapa
│   ├── highlightService.ts  Resaltado + zoom a un elemento
│   ├── authService.ts       Login (backend o demo) y persistencia de sesión
│   ├── arcgisTokenService.ts Token broker de ArcGIS (si servicios seguros)
│   └── googleStreetView.ts  Carga diferida de la Google Maps JS API
├── components/
│   ├── auth/                LoginPage, AuthGate, login.css
│   ├── map/                 MapContainer, MapControls, CoordinateConversion
│   ├── layout/              AppShell (shell), shell.css
│   ├── panels/              Un componente por herramienta (ver §6)
│   └── common/              ErrorBoundary, useBindView (hook)
├── i18n/
│   ├── strings.ts           Diccionarios es-EC / en-US + interpolación
│   └── useI18n.ts           Hook t(key, params)
└── styles/index.css         Estilos globales

public/config/               Configuración externa (se copia a dist/config)
├── app-config.json          Mapa, SR, filtros, impresión, auth, Street View
├── searches.json            Definición de búsquedas
└── popups.json              Definición de popups por capa

server/authServer.mjs        Backend de auth/JWT + token broker (Node nativo)
web.config                   Configuración de IIS (URL Rewrite, MIME, seguridad)
vite.config.ts               Build + copia de assets locales del SDK/Calcite
.github/workflows/ci.yml     CI: typecheck, lint, test, build
```

---

## 3. Capa de configuración (el "cerebro" parametrizable)

Todo lo que cambia entre despliegues vive en JSON externo. **No hay URLs ni IDs
"quemados" en el código.**

| Archivo | Qué define |
|---|---|
| `app-config.json` | URL del mapa base y su tipo (teselado/dinámico), URL del servicio de red, **WKID** del mapa, `geometryServiceUrl` on-prem, extensión/centro inicial, capas visibles al arrancar, filtros disponibles, unidades de medición, URL del servicio de impresión, Street View, y parámetros de auth. |
| `searches.json` | Lista de búsquedas: por capa (`type:"layer"`) o por tabla relacionada (`type:"relatedTable"`), con campo, operador, salida y modo de relación. |
| `popups.json` | Por capa: título, campos (con alias/orden), registros relacionados y si muestra el botón de Street View. |

- **`configLoader.ts`** hace `fetch(..., { cache: 'no-store' })` de los tres archivos,
  los valida (que existan URLs y WKID) y devuelve un objeto `FullConfig` tipado.
- **`types/config.ts`** describe cada campo con TypeScript, de modo que el resto del
  código consume la config con autocompletado y verificación de tipos.
- Como es *fetch* en tiempo de ejecución (no `import`), se puede editar el JSON en el
  servidor y recargar la app **sin recompilar** (RNF-CFG-03).

---

## 4. Estado global — los *stores* (Zustand)

Zustand es un contenedor de estado minimalista. Cada *store* es un "hook" que
cualquier componente puede leer; cuando el estado cambia, solo los componentes que
usan ese dato se vuelven a renderizar. Este es el mecanismo que **desacopla** las
herramientas (RF-ARQ-01): ninguna importa a otra; todas hablan a través del store.

| Store | Contiene | Quién lo usa |
|---|---|---|
| `useConfigStore` | `config` (FullConfig), `load()`, `reload()` | Todos |
| `useAuthStore` | `session`, `login()`, `logout()`, `isAuthenticated()` | AuthGate, LoginPage, AppShell |
| `useMapStore` | `view` (MapView), `map`, `basemapLayer`, `graphicsLayer`, `sketchLayer`, `featureLayers`, `activeTool`, `selectedFeatures` | MapContainer (escribe), todos los paneles (leen) |
| `useUiStore` | `theme`, `toggleTheme()` | App, AppShell |
| `useStreetViewStore` | `open`, `latitude`, `longitude`, `openAt()`, `close()` | MapContainer (dispara), StreetViewPanel |

**Idea clave:** `MapContainer` crea el `MapView` una sola vez y lo guarda en
`useMapStore`. Los paneles no crean mapas; **toman la instancia del store**. Añadir o
quitar una herramienta no afecta a las demás.

---

## 5. Servicios — la lógica

Los servicios separan la lógica de la UI. Hay dos tipos:

### 5.1 Lógica pura (testeable, sin SDK ni navegador)
- **`queryUtils.ts`** — construcción de cláusulas SQL/WHERE y exportación CSV:
  - `buildWhere(campo, op, valor, ci)` → `LIKE`/`=` con `UPPER()` para búsqueda
    insensible a mayúsculas (RF-SRC-02).
  - `buildValueWhere(campo, valores)` → `=` para uno, `IN (...)` para varios
    (filtro individual/múltiple, RF-FIL-02).
  - `escapeLike()` → escapa comillas (anti-inyección).
  - `featuresToCsv()` → serializa la selección a CSV (RF-SEL-05).
  - **Tiene 13 pruebas unitarias** (`queryUtils.test.ts`).

### 5.2 Integración con el SDK de ArcGIS
- **`mapFactory.ts`** — a partir de la config crea el `Map`: elige `TileLayer`
  (si el basemap es caché) o `MapImageLayer` (si es dinámico); crea las capas de red
  como `MapImageLayer` (subcapas) y/o `FeatureLayer`; aplica visibilidad inicial y
  asigna los `PopupTemplate`. Crea dos `GraphicsLayer` separados: uno para el
  **dibujo** del usuario y otro para **gráficos temporales** (marcadores/resaltados).
- **`popupTemplateFactory.ts`** — arma el contenido del popup: bloque de atributos
  configurados, registros relacionados (por `relationshipId` con
  `RelationshipContent`, o por *join* de campo llave con contenido personalizado que
  consulta la capa relacionada), y el **botón de acción "Street View"**.
- **`searchService.ts`** — ejecuta las búsquedas: directa sobre una capa, o sobre una
  tabla resolviendo el elemento espacial relacionado por `queryRelatedFeatures` o por
  *join*. También genera sugerencias/autocompletado. Limita resultados (paginación).
- **`selectionService.ts`** — selección por clic (`hitTest`) y por geometría dibujada
  (consulta por intersección a las FeatureLayers). Re-exporta `featuresToCsv`.
- **`projectionService.ts`** — usa el motor de proyección del SDK para convertir
  Lat/Long (4326) ↔ SR del mapa, y viceversa (usado por "Ir a XY" y Street View).
- **`highlightService.ts`** — dibuja un símbolo de resaltado, hace `goTo` (zoom/pan) y
  opcionalmente abre el popup. Lo comparten Búsqueda, Selección y Tabla.
- **`authService.ts`** — si hay backend (`apiBaseUrl`) hace `POST /login` y recibe un
  JWT real; si no, modo demo `admin/admin` con pseudo-token local. Persiste la sesión
  en `sessionStorage`.
- **`arcgisTokenService.ts`** — si los servicios ArcGIS están protegidos, pide un
  token al backend (token broker) y lo registra en el `IdentityManager` del SDK; lo
  renueva antes de expirar. Las credenciales del servidor **nunca** llegan al cliente.
- **`googleStreetView.ts`** — carga la Google Maps JS API bajo demanda; si no hay
  clave o conexión, degrada con elegancia.

---

## 6. Componentes de la interfaz

### 6.1 Arranque y layout
- **`main.tsx`** — registra Calcite y los web components del SDK; fija rutas de assets
  locales (`assets`, para Calcite, map-components y el core). Sin dependencia de CDN.
- **`App.tsx`** — carga config, restaura sesión, aplica tema/idioma, inicializa el
  token de ArcGIS si aplica, y muestra loader/errores/guard.
- **`AppShell.tsx`** — el "esqueleto": barra de navegación (logo, usuario, botón de
  tema, salir), **barra de acciones** con las herramientas, el panel lateral que
  muestra la herramienta activa, la región del mapa y el panel de Street View. Aquí se
  define el arreglo `TOOLS` — **para añadir una herramienta basta agregar una entrada
  y su componente** (no se toca nada más). Cada panel va envuelto en `ErrorBoundary`.

### 6.2 Autenticación
- **`LoginPage.tsx`** — formulario usuario/contraseña (RF-AUTH-01).
- **`AuthGate.tsx`** — *guard*: no renderiza el visor hasta autenticar (RF-AUTH-02).

### 6.3 Mapa
- **`MapContainer.tsx`** — crea el `MapView` con el SR configurado, lo publica en el
  store, y conecta la acción "Street View" del popup (convierte la geometría a
  Lat/Long y abre el panel). Fija `esriConfig.assetsPath` y `geometryServiceUrl`.
- **`MapControls.tsx`** — zoom (`arcgis-zoom`) y "ir a mi ubicación" (`arcgis-locate`).
- **`CoordinateConversion.tsx`** — posición del cursor en varios formatos
  (`arcgis-coordinate-conversion`, RF-GOTO-04).

### 6.4 Paneles de herramientas (uno por funcionalidad)

| Componente | Herramienta | Requisitos |
|---|---|---|
| `SearchPanel` | Búsqueda (tipo elegido de JSON, directa/relacionada, sugerencias, clic→zoom+popup) | RF-SRC-01..07 |
| `LayerListPanel` | Lista de capas on/off, opacidad por capa, leyenda | RF-LYR-01..04 |
| `BasemapConfig` | Visibilidad y opacidad del mapa base | §3.2 |
| `FilterPanel` | Filtro por campo (ALIMENTADORID), individual o múltiple `IN` | RF-FIL-01..05 |
| `SelectionTable` | Selección por clic/rectángulo/polígono, tabla sincronizada, fila→zoom, export CSV | RF-SEL-01..05 |
| `DrawTools` | Dibujo (`arcgis-sketch`) en capa separada | RF-DRW-01..04 |
| `MeasureTools` | Medición de distancia y área, unidades configurables | RF-MSR-01..03 |
| `GoToXYPanel` | Ir a X,Y en SR del mapa o Lat/Long con reproyección y validación | RF-GOTO-01..03 |
| `PrintPanel` | Impresión vía GPServer con leyenda (`arcgis-print`) | RF-PRT-01..04 |
| `StreetViewPanel` | Recuadro flotante de Google Street View, redimensionable/cerrable | RF-GSV-01..04 |

### 6.5 Común
- **`ErrorBoundary.tsx`** — captura errores de un módulo para que no derriben la app;
  muestra un aviso con "Reintentar".
- **`useBindView.ts`** — hook que enlaza el `MapView` del store a un componente web
  del SDK (asigna su propiedad `.view`).

---

## 7. Internacionalización (i18n)

- **`strings.ts`** — diccionarios completos **es-EC** (por defecto) y **en-US**, con
  interpolación de parámetros (`{n}`, `{wkid}`, `{msg}`).
- **`useI18n.ts`** — hook `t(clave, params?)` que toma el idioma de la config.
- Toda la UI usa `t(...)`; cambiar `app.defaultLocale` cambia el idioma sin tocar
  componentes. Con pruebas unitarias de traducción/interpolación.

---

## 8. Backend ligero (opcional pero recomendado)

`server/authServer.mjs` — servicio Node **sin dependencias npm** (solo módulos
nativos). Provee:
- `POST /login` → valida credenciales (hash scrypt) y emite un **JWT** propio.
- `GET /arcgis-token` → **token broker**: obtiene un token del ArcGIS Server con
  credenciales guardadas en el servidor y lo entrega al cliente autenticado.

Evolución prevista: demo `admin/admin` → BD + JWT (este backend) → AD/LDAP → token
broker. La arquitectura permite cambiar el proveedor **sin reescribir el frontend**.

---

## 9. Build y despliegue

- **Vite** empaqueta la SPA y **copia localmente** los assets del SDK (core),
  de los componentes web (`@arcgis/map-components`) y de Calcite → despliegue
  **autocontenido, sin CDN** (`js.arcgis.com`) ni AGOL (`arcgisonline.com`).
- **`web.config`** configura IIS: *URL Rewrite* con *fallback* SPA a `index.html`,
  MIME types (`.wasm`, `.json`, ESM), compresión, caché y cabeceras de seguridad; y
  una regla (comentada) para *proxy* al backend con ARR.
- **CI** (`.github/workflows/ci.yml`): en cada push/PR ejecuta typecheck, lint,
  pruebas y build.

---

## 10. Cómo extender (resumen práctico)

- **Nueva búsqueda** → añadir un objeto en `searches.json` (sin recompilar).
- **Nuevo filtro** → añadir una entrada en `app-config.json > filters`.
- **Popup de otra capa** → añadir una entrada en `popups.json`.
- **Nueva herramienta/panel** → crear el componente en `components/panels/`, añadir
  su entrada en `TOOLS` de `AppShell.tsx` y su clave i18n. Nada más.
- **Otro idioma** → añadir un diccionario en `strings.ts`.
- **Cambiar el SR** → cambiar `map.spatialReferenceWkid` en `app-config.json`.
- **Servicios protegidos** → `auth.arcgisServerSecured=true` + backend/token broker.

---

## 11. Trazabilidad requerimiento → módulo (resumen)

Ver la tabla completa en el `README.md` (§9). En síntesis: cada RF/RNF de la SRS
tiene un módulo responsable, y toda la parametrización externa cumple RNF-CFG.
