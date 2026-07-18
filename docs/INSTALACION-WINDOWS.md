# Instalación y configuración en Windows (paso a paso)

Guía para poner en marcha el **Visor de Redes Eléctricas** en Windows, tanto en modo
**desarrollo** (para probar) como en **producción sobre IIS**.

---

## 0. Requisitos previos

| Componente | Para qué | Dónde obtenerlo |
|---|---|---|
| **Node.js LTS 18 o 20** | Compilar la aplicación (no se necesita en el servidor final) | https://nodejs.org (instalador `.msi`) |
| **IIS** (Internet Information Services) | Servir la app en producción | Rol de Windows Server / "Activar características de Windows" |
| **Módulo URL Rewrite** | Rutas de la SPA (fallback a `index.html`) | https://www.iis.net/downloads/microsoft/url-rewrite |
| **Application Request Routing (ARR)** *(opcional)* | Proxy al backend de auth desde el mismo dominio | https://www.iis.net/downloads/microsoft/application-request-routing |
| Acceso de red al ArcGIS Server | Consumir los servicios de mapas | Su infraestructura (geoportal.cnelep.gob.ec) |

> El **navegador del usuario final** debe poder llegar al ArcGIS Server. Si además usa
> Street View, necesita salida a internet y una clave de Google.

---

## 1. Obtener el código

Opción A — con Git:
```bat
git clone <URL-del-repositorio> SIGServer
cd SIGServer
```

Opción B — descargar el ZIP del repositorio y descomprimir en `C:\proyectos\SIGServer`.

---

## 2. Modo DESARROLLO (para probar en su PC)

Abra **PowerShell** o **CMD** en la carpeta del proyecto:

```bat
npm install
npm run dev
```

- Al terminar, abra el navegador en **http://localhost:5173**.
- Inicie sesión con **admin / admin** (modo demo).

> Si `npm install` falla por el proxy corporativo, configure:
> `npm config set proxy http://usuario:clave@proxy:puerto` y
> `npm config set https-proxy http://usuario:clave@proxy:puerto`.

Comandos útiles:
```bat
npm run typecheck   :: verifica tipos TypeScript
npm run lint        :: revisa estilo/errores
npm test            :: ejecuta las pruebas unitarias
npm run build       :: genera la carpeta dist\ para producción
```

---

## 3. Configurar la aplicación (antes de publicar)

Toda la parametrización está en **`public\config\`** (en desarrollo) o en
**`dist\config\`** (tras compilar). Edite estos archivos con Bloc de notas o VS Code.

### 3.1 `app-config.json` — lo esencial

```jsonc
{
  "map": {
    "basemapUrl": "https://SU-SERVIDOR/arcgis/rest/services/REP/CartografiaN/MapServer",
    "basemapType": "tiled",              // "tiled" (caché, rápido) o "dynamic"
    "operationalServiceUrl": "https://SU-SERVIDOR/arcgis/rest/services/REP/CNELEPN/MapServer",
    "operationalMode": "mapimage",       // "mapimage", "feature" o "both"
    "featureSublayerIds": [9],           // capas cargadas como FeatureLayer (selección)
    "spatialReferenceWkid": 32717,       // Sistema de referencia del mapa
    "geometryServiceUrl": "https://SU-SERVIDOR/arcgis/rest/services/Utilities/Geometry/GeometryServer",
    "initialCenter": { "longitude": -79.9, "latitude": -2.19 },
    "initialZoom": 12,
    "visibleLayerIds": [9, 42]           // capas encendidas al arrancar
  },
  "print": {
    "printServiceUrl": "https://SU-SERVIDOR/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"
  },
  "streetView": { "enabled": true, "googleApiKeyRef": "GOOGLE_MAPS_KEY" },
  "auth": {
    "tokenExpirationMinutes": 60,
    "arcgisServerSecured": false,        // true si los servicios piden token
    "apiBaseUrl": ""                     // URL del backend; vacío = modo demo
  }
}
```

**Puntos a validar con su infraestructura** (marcan la diferencia):
1. ¿`CartografiaN` está publicado como **caché teselada** (`tiled`) o **dinámico**?
   Teselado = zoom/paneo fluido.
2. ¿Existe el **servicio de impresión** (PrintingTools GPServer)? Si no, quite/ajuste
   `print.printServiceUrl`.
3. Confirme el **WKID** correcto del mapa.
4. Confirme los **IDs reales de subcapas** (p. ej. el número de la capa "Punto de
   Carga") en `searches.json`.
5. Si los servicios requieren **token**, ponga `arcgisServerSecured: true` y configure
   el backend (paso 6).

### 3.2 `searches.json` — búsquedas
Cada objeto define un tipo de búsqueda. Ejemplo para buscar transformadores por el
campo `TRAFO` en la capa 9:
```jsonc
{
  "id": "trafo",
  "label": "Transformadores (TRAFO)",
  "type": "layer",
  "url": ".../CNELEPN/MapServer/9",
  "searchField": "TRAFO",
  "operator": "LIKE",
  "caseInsensitive": true,
  "outFields": ["TRAFO", "ALIMENTADORID", "OBJECTID"],
  "displayField": "TRAFO",
  "returnGeometry": true,
  "suggestions": true,
  "zoomScale": 2000
}
```
Para **agregar una búsqueda nueva** basta con añadir otro objeto y recargar la app.

### 3.3 `popups.json` — contenido de los popups por capa
Define título, campos con alias, registros relacionados y si aparece el botón de
Street View.

### 3.4 Clave de Google (Street View, opcional)
Cree un archivo **`.env`** (copie `.env.example`) y ponga:
```
VITE_GOOGLE_MAPS_KEY=su-clave-de-google
```
La clave se incorpora al compilar. Si la deja vacía, Street View se desactiva con
elegancia.

---

## 4. Compilar para producción

```bat
npm run build
```

Esto genera la carpeta **`dist\`** con todo lo necesario (HTML, JS, CSS, `config\` y
los assets del SDK/Calcite **locales**, sin CDN).

---

## 5. Publicar en IIS

### 5.1 Instalar IIS y módulos
1. **Panel de control → Programas → Activar o desactivar características de Windows**
   → marque **Internet Information Services** (incluya *Contenido estático* y
   *Filtrado de solicitudes*).
2. Instale el módulo **URL Rewrite** (enlace en la tabla de requisitos).
3. *(Opcional, solo si usará el proxy al backend)* instale **ARR** y actívelo:
   *IIS Manager → nodo del servidor → Application Request Routing Cache → Server
   Proxy Settings → marcar "Enable proxy"*.

### 5.2 Crear el sitio
1. Copie el contenido de **`dist\`** a, por ejemplo, `C:\inetpub\wwwroot\sigserver`.
   Asegúrese de que **`web.config`** (incluido en el proyecto) esté en esa raíz.
2. En **IIS Manager**: clic derecho en *Sitios → Agregar sitio web…*
   - Nombre: `SIGServer`
   - Ruta física: `C:\inetpub\wwwroot\sigserver`
   - Enlace: `https` en el puerto 443 (recomendado) con su certificado, o `http` 80
     para pruebas.
3. Dé permisos de lectura al grupo `IIS_IUSRS` sobre la carpeta.

El `web.config` ya trae configurado: *URL Rewrite* (fallback SPA), MIME types
(`.wasm`, `.json`, módulos ES), compresión, caché y cabeceras de seguridad
(HSTS, X-Frame-Options…). No hace falta configurarlo a mano.

### 5.3 Verificar
Abra `https://SU-SERVIDOR/` → debe aparecer la pantalla de login. Ingrese
**admin / admin** y compruebe que carga el mapa.

> **CORS:** si el navegador bloquea las peticiones al ArcGIS Server por *CORS*, tiene
> dos opciones: (a) habilitar el origen del visor en el ArcGIS Server, o (b) publicar
> el visor bajo el **mismo dominio** que el ArcGIS Server (o usar el proxy ARR).

---

## 6. Backend de autenticación / token (opcional)

Solo si quiere login real (no demo) o si los servicios ArcGIS están protegidos.

### 6.1 Ejecutarlo
```bat
copy .env.example .env
:: edite .env: JWT_SECRET, y si aplica ARCGIS_USERNAME/PASSWORD/TOKEN_URL
node server\authServer.mjs
```
Escucha en `http://localhost:4000`. Endpoints: `POST /login`, `GET /arcgis-token`,
`GET /health`.

### 6.2 Mantenerlo activo como servicio de Windows
Use **NSSM** (https://nssm.cc) para registrarlo como servicio:
```bat
nssm install SIGServerAuth "C:\Program Files\nodejs\node.exe" "C:\...\server\authServer.mjs"
nssm set SIGServerAuth AppDirectory "C:\...\SIGServer"
nssm start SIGServerAuth
```

### 6.3 Enlazarlo desde el visor y publicarlo tras IIS
1. En `app-config.json` ponga `"auth": { "apiBaseUrl": "/sig-api", ... }`.
2. En `web.config`, **descomente** la regla `ProxyAuthApi` (requiere ARR) para que
   `/sig-api/*` se reenvíe a `http://localhost:4000`.
3. En producción, cambie las credenciales demo del `USERS` del backend por su BD/LDAP.

---

## 7. Actualizar la aplicación

1. `git pull` (o reemplace archivos) → `npm install` → `npm run build`.
2. Copie el nuevo `dist\` sobre la carpeta del sitio en IIS.
3. Si solo cambió configuración (`config\*.json`), **no** hace falta recompilar: edite
   el JSON directamente en la carpeta publicada y recargue el navegador.

---

## 8. Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| Pantalla en blanco, error 404 al navegar | Falta URL Rewrite o `web.config` | Instale URL Rewrite; verifique `web.config` en la raíz |
| "No se pudo iniciar el visor" | Un `config\*.json` no carga o tiene error | Revise rutas y sintaxis JSON; abra `.../config/app-config.json` en el navegador |
| El mapa no aparece | URL del servicio incorrecta o CORS | Verifique URLs en `app-config.json`; resuelva CORS (paso 5.3) |
| Zoom lento | Basemap dinámico | Publique/So use caché teselada; `basemapType: "tiled"` |
| Iconos/leyenda no cargan | Assets no copiados | Recompile; confirme que `dist\assets` existe |
| Street View dice "no disponible" | Falta clave o sin internet | Configure `VITE_GOOGLE_MAPS_KEY` y recompile |
| No imprime | Sin servicio de impresión | Configure `print.printServiceUrl` de un GPServer válido |
