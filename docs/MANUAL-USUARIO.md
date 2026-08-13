# Manual de usuario — Interfaz gráfica

Guía breve para usar el **Visor de Redes Eléctricas**: qué hay en pantalla y cómo
interactuar con cada herramienta.

---

## 1. Ingreso (Login)

Al abrir la aplicación aparece la pantalla de acceso.

1. Escriba **Usuario** y **Contraseña** (por defecto de arranque: `admin` / `admin`).
2. Pulse **Ingresar**.
3. Si las credenciales son incorrectas, se muestra un aviso en rojo.

La sesión dura el tiempo configurado (por defecto 60 min). Para salir, use el botón
**Salir** de la barra superior.

---

## 2. Distribución de la pantalla

```
┌─────────────────────────────────────────────────────────────────────┐
│  LOGO / Título        [usuario]  [🌓 Oscuro/Claro]  [Salir]          │  ← Barra superior
├───┬─────────────────────────────────────────────────────────────────┤
│ 🔍│                                                        [ + ]      │  ← Controles del
│ 📚│                                                        [ − ]      │    mapa (zoom)
│ 🗺│                       MAPA                              [ 📍 ]      │    y ubicación
│ ▽ │                                                                   │
│ ▤ │                                                                   │
│ ✎ │                                                                   │
│ 📏│                                                                   │
│ ⯐ │   [ coordenadas del cursor ]              [ panel Street View ]  │
│ 🖨│                                                                   │
└───┴─────────────────────────────────────────────────────────────────┘
   ▲
 Barra de herramientas (al pulsar un ícono se abre su panel lateral)
```

- **Barra superior:** logo/título, nombre de usuario, botón de **tema claro/oscuro** y
  botón **Salir**.
- **Barra de herramientas (izquierda):** un ícono por herramienta. Al pulsarlo se abre
  su **panel lateral**; al volver a pulsarlo, se cierra.
- **Mapa (centro):** área principal. Arrastre para desplazar; rueda del ratón para
  acercar/alejar.
- **Controles del mapa (arriba a la derecha):** **+ / −** (zoom) y **📍** (ir a mi
  ubicación GPS).
- **Coordenadas (abajo a la izquierda):** muestra la posición del cursor en varios
  formatos.
- **Panel Street View (flotante):** aparece al pedirlo desde un popup.

---

## 3. Herramientas (barra izquierda)

### 3.1 🔍 Buscar
Localiza elementos por atributo.
1. Elija el **Tipo de búsqueda** (lista definida por configuración).
2. Escriba el texto (coincidencia parcial, no distingue mayúsculas). Si hay
   sugerencias, aparecen debajo: púlselas para completar.
3. Pulse **Buscar**. Los resultados se listan.
4. **Haga clic en un resultado** → el mapa hace zoom, lo **resalta** y abre su popup.
5. **Limpiar** borra resultados y resaltados.

> Hay búsquedas "relacionadas": por ejemplo, buscar por un código en una tabla y que
> el visor ubique en el mapa el elemento espacial asociado.

### 3.2 📚 Capas y leyenda
Controla qué se ve.
- **Casillas** para encender/apagar capas y subcapas.
- **Zoom a la capa:** cada capa y subcapa tiene un botón (icono de lupa) que
  **encuadra el mapa sobre esa capa**. Es la forma más rápida de ir a los datos
  cuando no sabe dónde están.
- **Opacidad por capa:** deslice el control para hacer una capa más/menos transparente.
- **Leyenda:** muestra la simbología de las capas visibles.

### 3.3 🗺 Mapa base
- **Visible:** interruptor para mostrar/ocultar la cartografía base.
- **Opacidad:** transparencia del mapa base.

### 3.4 ▽ Filtros
Muestra solo los elementos que cumplen un valor (p. ej. por `ALIMENTADORID`).
1. Elija la **capa/campo**.
2. Marque uno o varios **valores** (según permita, selección individual o múltiple).
3. Pulse **Aplicar** → el mapa muestra solo esos elementos.
4. **Limpiar** vuelve a mostrar todo.

### 3.5 ▤ Selección / Tabla
Selecciona elementos y los lista en una tabla.
1. Elija el modo: **Clic**, **Rectángulo** o **Polígono**.
   - *Clic:* pulse sobre un elemento del mapa.
   - *Rectángulo/Polígono:* dibuje un área; se seleccionan los elementos dentro.
2. Los seleccionados aparecen en el **panel de tablas bajo el mapa**, agrupados
   por capa (así siempre se sabe qué tipo de elemento es). Puede arrastrar el
   borde superior del panel para cambiar su altura.
3. **Marque las casillas** de las filas que le interesen: los elementos marcados
   se resaltan **en el mapa**. La casilla de la cabecera marca todo el grupo.
4. **Haga clic en una fila** (fuera de la casilla) → el mapa hace zoom a ese
   elemento y abre su información.
5. **Encuadrar marcados** lleva el mapa a todos los elementos marcados a la vez.
6. Use el **filtro** para reducir las filas mostradas cuando hay muchas.
7. **CSV** exporta lo marcado (o toda la selección si no hay nada marcado);
   **Limpiar** borra la selección.

> **Selecciones grandes:** los elementos se traen por lotes. Si el servicio tiene
> más de los que se pueden mostrar, aparece un aviso indicando cuántos se están
> viendo del total; acote la selección para verlos todos.

> Las columnas de esta tabla se configuran en `app-config.json → selection`.
> Por defecto se muestran `OBJECTID` y `GLOBALID`; con `fieldsByLayer` puede
> añadir campos concretos para ciertas capas sin cambiar el resto.

> La selección sigue activa aunque cierre el panel o la tabla. Para volver al
> modo de identificación, pulse **Terminar**.

#### Qué se exporta al CSV
La exportación se configura aparte, en `app-config.json → export`, porque en el
archivo suele hacer falta más información que en pantalla:

- Se guarda el **valor almacenado**, no la descripción del dominio (en pantalla lee
  «Poste de hormigón», en el archivo sale el código, que es lo que puede cruzar con
  la base de datos).
- Se añaden columnas de **geometría**: `X` e `Y` en puntos, y
  `X_INICIAL`, `Y_INICIAL`, `X_FINAL`, `Y_FINAL` en líneas.
- `fields` vacío exporta todos los atributos; con `fieldsByLayer` puede definir
  campos distintos por capa.

> Consulta las capas **encendidas** en ese momento, tanto si están publicadas como
> FeatureLayer como si vienen de un MapImageLayer. Si no obtiene resultados,
> compruebe que la capa esté encendida y acerque el mapa (algunas capas solo se
> dibujan y consultan a partir de cierta escala).

### 3.6 ▦ Tabla de atributos
El botón de tabla abre el **panel acoplado bajo el mapa**, con dos pestañas:
**Selección** (lo que haya seleccionado) y **Tabla de atributos** (una capa entera).

En la pestaña **Tabla de atributos**:
1. Elija la **capa** en la lista.
2. Elija el alcance:
   - **Solo lo visible:** únicamente los elementos dentro del área que está viendo
     en el mapa (se actualiza al navegar).
   - **Ver todo:** todos los elementos de la capa.
3. Opcionalmente escriba un **filtro** como expresión SQL, por ejemplo
   `ALIMENTADORID = 'A1'`, y pulse Intro.
4. Ordene y explore con los controles de la tabla.

> Las filas se cargan **por páginas**, no todas de golpe, para que las capas con
> muchos elementos no bloqueen el navegador.

### 3.7 ✎ Dibujo
Dibuje anotaciones sobre el mapa.
- Elija la forma (punto, línea, polígono, rectángulo, círculo) y dibuje.
- Puede **mover, editar y borrar** las geometrías.
- Los dibujos están en una capa aparte y **no interfieren** con la consulta/selección.

### 3.8 📏 Medición
- **Distancia:** pulse puntos sucesivos; doble clic para terminar.
- **Área:** dibuje un polígono; muestra la superficie.
- **Limpiar medición** borra el resultado. Las unidades vienen de la configuración.

### 3.9 ⯐ Ir a XY / LatLong
Navega a una coordenada exacta.
1. Elija el **sistema de referencia de entrada** (el del mapa, o Lat/Long WGS84).
2. Escriba **X/Y** (o **Longitud/Latitud**).
3. Pulse **Ir a la ubicación** → el mapa se centra y coloca un marcador. Si usa
   Lat/Long, se **reproyecta** automáticamente al sistema del mapa.
4. Se validan los rangos; los errores se muestran con un mensaje claro.

### 3.10 🖨 Imprimir
Genera un mapa imprimible con simbología y leyenda.
1. Elija plantilla, formato (PDF/PNG/JPG), título y escala.
2. Pulse imprimir; al terminar se ofrece el archivo para descargar.

> Requiere un servicio de impresión (GPServer) publicado y configurado.

---

## 4. Popups e identificación

Al hacer clic sobre el mapa (sin ninguna herramienta activa) se **identifican todos
los elementos que hay bajo ese punto**, de todas las capas encendidas, y se abren en
**una sola ventana**:

- Si hay varios elementos, use las flechas de la ventana para recorrerlos. Cada uno
  indica **de qué capa procede**, así sabe si está viendo el poste, el
  transformador o la luminaria de ese mismo punto.
- Muestra los **atributos** configurados (con sus alias).
- Puede mostrar **registros relacionados** (p. ej. desde un transformador, sus
  consumidores asociados).
- Si está habilitado, incluye un botón **Street View** (ver abajo).

> Mientras esté activa la herramienta de **Selección** o la de **Street View**, el
> clic hace esa otra acción en lugar de identificar. Pulse **Terminar** en el panel
> de selección para volver al modo de identificación.

---

## 5. Google Street View

Hay dos formas de abrirlo:
- Desde el botón **Street View** del popup de un elemento.
- Desde la herramienta **Street View** de la barra: pulse **Elegir punto en el mapa**
  y luego haga clic en **cualquier lugar** del mapa.

El comportamiento depende de si hay clave de Google configurada:

| Situación | Qué ocurre |
|---|---|
| **Sin clave de Google** (caso habitual) | Street View se abre en una **ventana emergente independiente** del navegador. No requiere clave ni facturación. Al elegir otro punto se **reutiliza la misma ventana**, no se abre otra. |
| **Con clave** (`VITE_GOOGLE_MAPS_KEY`) | El panorama se **incrusta** en un recuadro flotante dentro de la app, redimensionable y cerrable. |

Mientras Street View está abierto, el mapa muestra un **muñeco** en la ubicación que
se está viendo, de modo que siempre sepa a qué punto corresponde la vista de calle.
El muñeco se mueve al elegir otro punto y **desaparece** al cerrar Street View (con
el botón **Cerrar Street View** del panel o cerrando la ventana de Google).

> Si el navegador bloquea la ventana emergente, la aplicación muestra un enlace para
> abrirla manualmente. Permita las ventanas emergentes para este sitio y no volverá a
> preguntar.

---

## 6. Otros controles

| Control | Ubicación | Función |
|---|---|---|
| **+ / −** | Arriba derecha | Acercar / alejar (también con la rueda del ratón) |
| **📍 Ubicación** | Arriba derecha | Centra el mapa en su posición GPS |
| **Coordenadas** | Abajo izquierda | Posición del cursor en varios formatos |
| **🌓 Tema** | Barra superior | Alterna modo claro / oscuro (se recuerda) |
| **Salir** | Barra superior | Cierra la sesión |

---

## 7. Consejos

- La app es **responsiva**: funciona en escritorio, tablet y móvil (en móvil el panel
  ocupa toda la pantalla).
- Solo puede haber **un panel de herramienta abierto** a la vez; abrir otro cierra el
  anterior. El mapa y los popups siguen activos.
- Si una herramienta muestra un aviso de error, use **Reintentar**: el fallo de un
  módulo no afecta al resto de la aplicación.
