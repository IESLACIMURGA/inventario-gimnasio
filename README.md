# Inventario del almacén del gimnasio

Web para consultar el material del almacén del gimnasio del IES Lacimurga: qué hay, cuántas unidades, de qué talla, en qué estado y en qué estantería está. Cada estantería, armario o caja tiene una etiqueta QR que, al escanearla con el móvil, muestra todo lo que contiene.

- **Gratis**: la web se aloja en GitHub Pages y los datos están en una hoja de Google Sheets. No hay servidor ni base de datos que mantener.
- **Segura**: la web solo *lee* datos. Para cambiar el inventario hay que tener permiso de edición en la hoja de Google, que solo tienen los profesores. No hay cuentas, contraseñas ni datos de alumnos.
- **Funciona en móvil, tablet y ordenador**, y se puede instalar como app en el móvil (PWA).

| Qué puede hacer cualquiera desde la web | Qué hacen los profesores desde la hoja de Google |
| --- | --- |
| Buscar material por nombre, talla, ubicación o código | Añadir, editar u ocultar materiales |
| Navegar por categorías y subcategorías | Cambiar cantidades, tallas, estados y ubicaciones |
| Ver cantidades disponibles y por estado (para lavar, dañado…) | Crear categorías, subcategorías, estados y ubicaciones |
| Ver dónde está cada cosa y escanear los QR | Poner fotos |
| Exportar a Excel e imprimir etiquetas QR | Consultar el historial de cambios (historial de versiones de Google) |

---

## Índice

1. [Cómo funciona](#1-cómo-funciona)
2. [Puesta en marcha paso a paso](#2-puesta-en-marcha-paso-a-paso)
3. [Uso diario (profesores)](#3-uso-diario-profesores)
4. [Fotos y logo](#4-fotos-y-logo)
5. [Etiquetas QR](#5-etiquetas-qr)
6. [Seguridad y privacidad](#6-seguridad-y-privacidad)
7. [Copias de seguridad e historial](#7-copias-de-seguridad-e-historial)
8. [Probar en tu ordenador y pruebas automáticas](#8-probar-en-tu-ordenador-y-pruebas-automáticas)
9. [Límites de los servicios gratuitos](#9-límites-de-los-servicios-gratuitos)
10. [Estructura del proyecto](#10-estructura-del-proyecto)
11. [Decisiones y limitaciones](#11-decisiones-y-limitaciones)

---

## 1. Cómo funciona

```
 Profesores ──editan──▶ Hoja de Google Sheets (5 pestañas)
                               │  «Publicar en la web» (solo lectura, CSV)
                               ▼
 Cualquiera ──abre──▶ Web en GitHub Pages ──descarga las pestañas y calcula los totales
```

La hoja tiene cinco pestañas. Las cantidades **solo** se escriben en *Existencias*; todos los totales (disponibles, unidades, por talla, por estado, por ubicación) los calcula la web a partir de esas filas, así que nunca pueden no cuadrar.

| Pestaña | Una fila por… | Columnas |
| --- | --- | --- |
| **Materiales** | cada material | `codigo`, `nombre`, `descripcion`, `categoria`, `foto`, `fotos_extra`, `notas`, `activo`, `alta`, `actualizado` |
| **Existencias** | cada combinación de material + talla + ubicación + estado | `material`, `variante`, `ubicacion`, `estado`, `cantidad` |
| **Categorias** | cada categoría o subcategoría | `nombre`, `padre`, `icono`, `color`, `orden`, `activa` |
| **Estados** | cada estado | `nombre`, `disponible`, `color`, `categorias`, `activo` |
| **Ubicaciones** | cada sitio físico | `codigo`, `nombre`, `padre`, `tipo`, `descripcion`, `activa` |

Ejemplo — camiseta del instituto, talla M (2 disponibles, 1 para lavar, 2 sin estampar):

| material | variante | ubicacion | estado | cantidad |
| --- | --- | --- | --- | --- |
| ROP-CAM-INS | M | BURRO-A | Disponible | 2 |
| ROP-CAM-INS | M | BURRO-A | Para lavar | 1 |
| ROP-CAM-INS | M | BURRO-A | Sin estampar | 2 |

La web muestra «Talla M: 2 disponibles de 5» y el total general de la camiseta.

## 2. Puesta en marcha paso a paso

### Paso 1 · Crear la hoja de Google

1. Descarga [`plantilla/inventario-gimnasio.xlsx`](plantilla/inventario-gimnasio.xlsx) (ya trae los datos de ejemplo, listas desplegables y explicaciones en las cabeceras).
2. Entra en [Google Drive](https://drive.google.com) con la cuenta del centro o la tuya → **Nuevo → Subir archivo** → elige el `.xlsx`.
3. Ábrelo y pulsa **Archivo → Guardar como Hojas de cálculo de Google**. Trabaja siempre sobre esta copia nueva (puedes borrar el `.xlsx` de Drive).
4. Sustituye los datos de ejemplo por los reales cuando quieras (puedes hacerlo después).

> **No cambies los nombres de las columnas de la fila 1.** El orden de las columnas y los nombres de las pestañas sí puedes cambiarlos.

### Paso 2 · Dar permiso solo a los profesores

1. Botón **Compartir** (arriba a la derecha).
2. Añade el correo de cada profesor como **Editor**.
3. En «Acceso general» deja **Restringido**. Así nadie más puede *editar* (ni ver el archivo editable).

### Paso 3 · Publicar la hoja en modo lectura

1. **Archivo → Compartir → Publicar en la web**.
2. En «Enlace» elige **Documento completo** y el formato **Valores separados por comas (.csv)**.
3. En «Contenido publicado y configuración» comprueba que esté marcado **Volver a publicar automáticamente cuando se realicen cambios**.
4. Pulsa **Publicar** y copia el enlace. Tendrá este aspecto:
   `https://docs.google.com/spreadsheets/d/e/2PACX-…/pub?output=csv`

Este enlace solo permite **leer** los datos; no da acceso para editar.

### Paso 4 · Apuntar el número (gid) de cada pestaña

Haz clic en cada pestaña de la hoja y mira el final de la dirección del navegador: `…/edit#gid=123456789`. Ese número es el **gid**. Apunta el de las cinco pestañas (Materiales, Existencias, Categorias, Estados, Ubicaciones).

### Paso 5 · Configurar la web

En GitHub, abre el archivo [`js/config.js`](js/config.js) → icono del lápiz (**Edit**) y rellena:

```js
fuente: 'google',
googleUrlPublicada: 'https://docs.google.com/spreadsheets/d/e/2PACX-…/pub?output=csv',
googleGids: {
  materiales: '0',
  existencias: '123456789',
  categorias: '…',
  estados: '…',
  ubicaciones: '…',
},
urlPublica: 'https://evagr11.github.io/NOMBRE-DEL-REPO/',
```

Pulsa **Commit changes**.

### Paso 6 · Activar GitHub Pages

1. El repositorio debe ser **público** (GitHub Pages es gratis solo en repositorios públicos; no hay ninguna contraseña ni dato personal en el código).
2. En el repositorio: **Settings → Pages**.
3. En «Build and deployment»: *Source* = **Deploy from a branch**, *Branch* = **main** y carpeta **/ (root)** → **Save**.
4. En uno o dos minutos aparecerá arriba la dirección de la web: `https://evagr11.github.io/NOMBRE-DEL-REPO/`.
5. Ábrela y comprueba que aparece tu inventario. Si sale un aviso de «Revisión de datos», corrige esas filas en la hoja.

## 3. Uso diario (profesores)

Todo se hace en la hoja de Google; la web se actualiza sola (suele tardar unos minutos porque Google publica los cambios con cierto retraso). En la web, **↻ Actualizar datos** vuelve a descargar la hoja.

| Quiero… | En la hoja… |
| --- | --- |
| Dar de alta un material | Nueva fila en **Materiales** con un código único (p. ej. `BAL-FUT-02`) y al menos una fila en **Existencias** |
| Cambiar cuántas hay | Cambia `cantidad` en **Existencias** |
| Pasar 1 camiseta M de «Disponible» a «Para lavar» | Resta 1 en la fila *Disponible* y suma 1 en la fila *Para lavar* (créala si no existe) |
| Repartir un material en varios sitios | Una fila de **Existencias** por cada ubicación (3 en `EST-A`, 5 en `EST-B`) |
| Mover material de sitio | Cambia `ubicacion` en su fila (o resta en una y suma en otra) |
| Añadir tallas o colores | Una fila por cada `variante` (S, M, L…, o Rojo, Azul…). Vacía si no tiene variantes |
| Crear una subcategoría | Fila nueva en **Categorias** con el nombre de su categoría en `padre` |
| Mover una subcategoría | Cambia su `padre`. Los materiales la siguen porque apuntan a su nombre |
| Renombrar una categoría | Cambia el nombre en **Categorias** y usa **Editar → Buscar y reemplazar** para cambiarlo en **Materiales** |
| Crear un estado | Fila en **Estados**. `disponible` = *sí* si esas unidades se pueden usar. En `categorias` puedes limitarlo (p. ej. *Ropa*) |
| Ocultar algo sin borrarlo | Pon `no` en `activo` / `activa` |
| Anotar material prestado | Usa el estado *Prestado* (no cuenta como disponible) |

Si algo no cuadra (un material que no existe, una cantidad negativa, un estado mal escrito…), la web **no se rompe**: ignora o marca esa fila y lo explica en **Revisión de datos** con el número de fila.

## 4. Fotos y logo

**Opción recomendada: subir las fotos al repositorio.**

1. Reduce las fotos antes de subirlas (unos 1200 px de lado y menos de 500 KB; el móvil suele tener una opción de «tamaño mediano»).
2. En GitHub, entra en la carpeta `img` → **Add file → Upload files** → arrastra las fotos → **Commit changes**.
3. En la columna `foto` de **Materiales** escribe la ruta: `img/balon-futbol.jpg`. Para varias fotos, ponlas en `fotos_extra` separadas por `|`.

**Alternativa: Google Drive.** Comparte la foto como «Cualquier persona con el enlace» y pega el enlace de compartir en `foto`; la web lo convierte en una imagen. Es más cómodo desde el móvil, pero depende de que Google siga sirviendo esas miniaturas.

Las fotos son públicas (cualquiera con la dirección de la web puede verlas): **no subas fotos en las que salgan alumnos**.

**Logo:** sube el logo del instituto como `img/logo.png` y aparecerá en la barra lateral. Si no existe, se muestra el nombre del centro en texto.

## 5. Etiquetas QR

1. Antes de imprimir, comprueba que `urlPublica` en `js/config.js` tiene la dirección definitiva de la web.
2. En la web: **Etiquetas QR** → marca las ubicaciones → elige el tamaño → **Imprimir**. También puedes imprimir una sola desde la página de cada ubicación.
3. El QR solo contiene la dirección de la ubicación (por ejemplo `…/#/ubicacion/EST-A1`): ni contraseñas ni datos privados.
4. El QR se basa en el **código** de la ubicación. Puedes cambiar el nombre todas las veces que quieras, pero **no cambies el código** de una ubicación que ya tenga etiqueta.

## 6. Seguridad y privacidad

- **Quién puede cambiar datos:** solo quien tenga permiso de edición en la hoja de Google. La web no tiene ningún formulario ni forma de escribir datos, así que no hay nada que «hackear» en ella para cambiar el inventario. Recomendación: que los profesores tengan activada la verificación en dos pasos en su cuenta de Google.
- **Qué es público:** el inventario (nombres, cantidades, ubicaciones, fotos). No hay datos personales: ni alumnos, ni préstamos a personas, ni correos.
- **Protección de la web:**
  - Todos los textos de la hoja se muestran como texto, nunca como código (protección frente a XSS); está comprobado con una prueba que mete código malicioso en la hoja.
  - Política de seguridad de contenidos (CSP): el navegador solo ejecuta el código de la propia web y solo descarga datos de la web y de Google Sheets.
  - Las fotos solo pueden ser rutas de la propia web o enlaces `https`.
  - El archivo exportado a Excel neutraliza celdas que empiezan por `=`, `+`, `-` o `@` (inyección de fórmulas).
  - Sin dependencias externas: el generador de QR está incluido en el proyecto.
- **No hay secretos en el código:** el enlace publicado de la hoja es de solo lectura y puede estar en el repositorio público.

## 7. Copias de seguridad e historial

- **Historial de cambios:** en la hoja, **Archivo → Historial de versiones → Ver historial de versiones** muestra quién cambió qué y cuándo, y permite restaurar una versión anterior.
- **Copia de seguridad:** de vez en cuando (por ejemplo, a final de trimestre) **Archivo → Descargar → Microsoft Excel (.xlsx)** y guárdalo en otro sitio. Para restaurar, súbelo a Drive y repite los pasos 1–5 (o copia las pestañas a la hoja actual).
- **La web y las fotos** están en GitHub, que guarda todas las versiones. Puedes descargar una copia con **Code → Download ZIP**.
- Si Google no responde, cada dispositivo muestra la **última copia** que descargó, con un aviso.

## 8. Probar en tu ordenador y pruebas automáticas

La web usa módulos de JavaScript, que no funcionan abriendo el archivo con doble clic: hay que servirla. Desde la carpeta del proyecto:

```bash
python3 -m http.server 8000
```

y abre <http://localhost:8000>. Con `fuente: 'demo'` usa los datos de ejemplo de la carpeta `datos/`.

Pruebas automáticas (necesitan Node.js 18 o superior), desde la carpeta del proyecto:

```bash
node --test tests/*.test.mjs
```

Cubren la lectura de CSV, el cálculo de cantidades por variante, estado y ubicación, el rechazo de cantidades negativas o erróneas, los filtros y el buscador, la jerarquía de categorías y ubicaciones, la seguridad de las fotos y del archivo exportado, y que los QR se leen correctamente (esta última solo si tienes Python con OpenCV; si no, se omite).

## 9. Límites de los servicios gratuitos

| Servicio | Límite | ¿Nos afecta? |
| --- | --- | --- |
| GitHub Pages | Web de hasta 1 GB, 100 GB de tráfico al mes (límite blando), solo repositorios públicos en el plan gratuito | No: la web pesa menos de 1 MB; con fotos optimizadas caben miles |
| Google Sheets | 10 millones de celdas por hoja | No: un almacén usa unos pocos miles |
| «Publicar en la web» | Los cambios tardan unos minutos en verse | Es el único inconveniente práctico |

Ninguno exige pago ni cuentas para los alumnos. Si algún día GitHub o Google cambiaran sus condiciones, la web es una carpeta de archivos estáticos que funciona en cualquier alojamiento (o en un ordenador del centro con el comando del apartado 8), y los datos se pueden exportar a Excel.

## 10. Estructura del proyecto

```
index.html                 Página única de la web
css/estilos.css            Estilos (escritorio, tablet, móvil e impresión)
js/config.js               ← Configuración: lo único que hay que editar
js/app.js                  Interfaz: vistas, buscador, filtros, exportar, etiquetas
js/datos.js                Modelo de datos y cálculo de cantidades (sin interfaz, probado)
js/carga.js                Descarga de las pestañas y copia local sin conexión
js/csv.js                  Lectura y exportación de CSV
js/qr.js                   Generador de códigos QR (sin dependencias)
datos/*.csv                Datos de ejemplo (fuente: 'demo')
plantilla/*.xlsx           Plantilla para crear la hoja de Google
img/                       Iconos, logo y fotos de los materiales
manifest.webmanifest, sw.js  Instalación como app (PWA) y uso sin conexión
tests/                     Pruebas automáticas
```

## 11. Decisiones y limitaciones

- **Sin préstamos ni reservas ni cuentas de usuario.** Es una decisión deliberada: así no hace falta servidor ni guardar datos de alumnos. Si se presta algo, se puede reflejar con el estado *Prestado*.
- **Google Sheets como «base de datos».** Es gratis, los profesores ya saben usarlo, tiene permisos e historial de versiones. La contrapartida es el retraso de unos minutos en publicar cambios y que la integridad la comprueba la web (avisos en «Revisión de datos») en lugar de la propia hoja, aunque la plantilla trae listas desplegables y validación de cantidades para evitar errores.
- **El inventario es público** para quien tenga la dirección de la web. Si se quisiera restringir la consulta, haría falta un servidor o un servicio con inicio de sesión.
- **HTML, CSS y JavaScript sin frameworks ni compilación:** se sube tal cual a GitHub Pages y se puede entender y modificar sin herramientas adicionales.
