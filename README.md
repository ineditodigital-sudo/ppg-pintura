# Coating Systems MX

Sitio de **Coating Systems Mx S de RL de CV** (Aguascalientes, México),
distribuidor autorizado PPG de recubrimientos industriales.

El sistema de diseño replica el de [ppg.com/es-MX](https://www.ppg.com/es-MX)
—paleta, tipografía y arquitectura de bloques— porque así lo pidió el cliente.
La marca del sitio es **PPG**; Coating Systems MX figura como su distribuidor
autorizado, y los recursos y datos de contacto salen de
[coatingsystemsmx.com](https://www.coatingsystemsmx.com).

**El contenido sobre el fabricante es material oficial de PPG**, en español y
resumido: sale de [powdercoatings.ppg.com](https://powdercoatings.ppg.com) y de
la presentación comercial que compartió el cliente. Nada de lo que se afirma de
PPG está inventado; lo que no se pudo verificar contra una de esas dos fuentes
se quitó en vez de rellenarse a ojo.

> La lista de precios de esa presentación viene marcada como **información
> confidencial** —prohibida su reproducción o divulgación a terceros—. Ni los
> precios, ni el mínimo de 400 kg, ni el cargo por cancelación entran en el
> sitio.

- **Frontend:** Vite + React 19 + TypeScript + React Router
- **Backend:** PHP 8 sin framework, API REST de contenido
- **Contenido:** modelo de bloques tipados en JSON

---

## Arranque

### Frontend

```bash
npm install --prefix frontend
```

```bash
npm run dev --prefix frontend
```

Queda en `http://localhost:5173`. Si el puerto está ocupado, Vite toma el
siguiente libre (o define `PORT`).

### Backend (opcional en desarrollo)

```bash
php -S localhost:8000 -t backend/public
```

PHP 8.4.24 está instalado en `%LOCALAPPDATA%\Programs\php` y añadido al `PATH`
de usuario (abre una terminal nueva para que lo tome). Su `php.ini` deriva de
`php.ini-production` con `mbstring`, `fileinfo`, `openssl` y `curl` habilitados:
`mbstring` lo pide la validación del formulario y `fileinfo` la comprobación por
contenido de las imágenes que se suben desde el panel.

`.claude/launch.json` define las dos configuraciones —`ppg-frontend` y
`ppg-api`—, así que ambos servidores se arrancan desde el selector del editor
sin escribir el comando.

El frontend **no depende** de que la API esté levantada: `src/lib/api.ts`
intenta `/api/...` y, si no responde en 3 segundos, usa la copia local de
`src/content`. Lo único que exige PHP es el envío del formulario de contacto.

### Build de producción

```bash
npm run build --prefix frontend
```

---

## Panel de contenido

**https://pinturaenpolvo-mx.com/admin**

Desde ahí se editan las páginas (bloques: añadir, reordenar, eliminar y editar
cada campo), la navegación, las líneas de negocio, los ajustes del sitio, la
biblioteca de imágenes, los avisos por correo y la bandeja de mensajes del
formulario.

El grupo **Catálogo** cubre el contenido que no vive en páginas:

| Pantalla | Archivo | Alimenta |
|---|---|---|
| Mercados | `data/markets.json` | `/mercados` y cada `/mercados/{slug}` |
| Carta de color | `data/colors.json` | `/colores` y el carrusel de la portada |
| Destacados | `data/featured-products.json` | El bloque `productShowcase` |

La carta de color no usa el formulario genérico: son 83 referencias que se
revisan de un vistazo —qué hay en existencia— y se corrigen celda a celda, así
que es una tabla con buscador y filtro por familia. Cambiar el identificador de
una familia sin reasignar sus referencias deja huérfanos los colores, y el
guardado se rechaza antes de tocar el disco.

El formulario de cada bloque no está escrito a mano: lo genera `BlockForm` a
partir de `src/admin/schema.ts`. Añadir un tipo de bloque al CMS es describirlo
ahí, crear el componente en `components/blocks/` y registrarlo en el `switch` de
`BlockRenderer.tsx`.

### Seguridad

- Sesión PHP con cookie `httponly` / `secure` / `samesite=Strict`, caducidad a
  las 8 horas e id regenerado al entrar.
- Contraseña guardada sólo como hash bcrypt en `api/config/users.json`, que no
  es accesible por HTTP (403).
- Token CSRF obligatorio en `X-CSRF-Token` para POST, PUT y DELETE.
- Cinco intentos fallidos por IP bloquean el acceso 15 minutos, incluso con la
  contraseña correcta.
- Las imágenes se validan por contenido real (`finfo` + `getimagesize`), no por
  extensión; SVG no se admite en subidas y `assets/uploads/` tiene la ejecución
  de PHP desactivada.
- Todo guardado pasa por `ContentValidator`: un payload inválido devuelve 422 y
  **no toca el disco**. Cada escritura respalda en `data/.backups` (10 versiones)
  y usa `rename` atómico.

---

## Despliegue

En producción: **https://pinturaenpolvo-mx.com** (cPanel, Cloudflare delante,
**PHP 8.1.34**).

```powershell
$env:FTP_HOST='...'; $env:FTP_USER='...'; $env:FTP_PASS='...'
.\deploy\deploy.ps1
```

**El docroot es `/public_html` a secas.** Es el dominio principal de la cuenta,
no un addon, así que no cuelga de `/public_html/<dominio>`. Subir ahí deja el
sitio en un subdirectorio y todas las rutas menos `/` devuelven 404 — pasó en el
primer intento de migración. `-RemoteRoot` ya trae el valor correcto por defecto.

**PHP bajó de 8.3 a 8.1** al cambiar de cuenta. El código no usa nada posterior
a 8.1 y los once endpoints responden, pero conviene subirlo desde
**cPanel → MultiPHP Manager** para no quedarse en una rama que dejará de
recibir parches de seguridad.

**El servidor es la fuente de verdad del contenido.** Desde que el CMS está en
marcha, un despliegue normal sólo sobrescribe código y assets: nunca pisa
`api/data/`, `api/config/` ni `api/storage/`.

| Modificador | Efecto |
|---|---|
| *(ninguno)* | Sube el código y los assets que hayan cambiado. No toca el contenido editado. |
| `-Full` | Ignora el manifiesto y vuelve a subir el paquete entero. |
| `-LimpiarAssets` | Borra del servidor los bundles con hash que ya no usa nadie. |
| `-SeedContent` | Sube `data/` sólo si el archivo aún no existe en el servidor. |
| `-SeedAuth` | Sube `config/users.json` sólo si aún no existe. |
| `-PushContent` | Fuerza `data/` y **sobrescribe lo editado**. Pide confirmación. |
| `-WhatIfOnly` | Prepara el paquete y lista qué subiría y qué borraría, sin tocar nada. |
| `-SkipBuild` | Reutiliza el `dist` existente. |

**Sólo sube lo que cambió.** Tras cada envío queda en `deploy/.manifiesto.json`
el hash de lo que hay en el servidor, y el siguiente despliegue compara contra
él en local, sin preguntarle nada al FTP. De 68 archivos y 2.27 MB se pasa a un
puñado: las imágenes, las fuentes y el PHP rara vez cambian, y los bundles
llevan el hash en el nombre. Si el manifiesto y el servidor se desincronizan
—se despliega desde otra máquina, alguien borra algo a mano—, `-Full` rehace el
envío completo; el manifiesto es una caché, nunca la verdad.

**Se sube por lotes, no archivo a archivo.** Una conexión FTP por archivo son
~70 conexiones seguidas y este hosting las corta a media transferencia
(`curl (28)`), dejando el despliegue a medias. Cada lote de 12 viaja por una
sola conexión, con reintentos escalonados y caída a envío individual para
identificar al culpable si un lote entero falla.

**Los bundles antiguos se acumulan.** Como el nombre lleva el hash del
contenido, cada build publica archivos nuevos y los viejos se quedan ahí para
siempre. `-LimpiarAssets` los borra; combínalo con `-WhatIfOnly` para ver antes
la lista. Sólo toca lo que encaja en el patrón `index-…`/`AdminApp-…` con hash:
nunca una imagen ni nada subido desde el panel.

Sólo escribe dentro del directorio de `-RemoteRoot`.

Estructura resultante en el document root:

```
index.html · assets/          SPA compilada
.htaccess                     Fallback SPA, enrutado /api, caché, seguridad
api/index.php                 Front controller (público)
api/src/ · data/ · storage/   Bloqueados por .htaccess (403)
```

El front controller detecta el layout: en desarrollo `src/` y `data/` están un
nivel por encima de `backend/public/`; en producción, junto a `api/index.php`.
Por eso el mismo archivo sirve en ambos entornos.

### Compresión: resuelta por Cloudflare

En el hosting anterior el bundle viajaba sin comprimir porque `mod_deflate` no
estaba activo. El dominio nuevo va **detrás de Cloudflare**, que comprime en el
borde sin configurar nada:

| | Sin comprimir | Servido |
|---|---|---|
| `index-*.js` | 335 KB | **105 KB** (brotli, −69%) |
| `index-*.css` | 72 KB | **15 KB** (brotli, −79%) |

```bash
curl -s -o /dev/null -D - -H "Accept-Encoding: gzip, br" https://pinturaenpolvo-mx.com/assets/index-*.js
```

Si no aparece `Content-Encoding`, algo ha cambiado en Cloudflare.

**Cloudflare está delante en modo proxy.** El DNS del dominio no apunta al
hosting sino a Cloudflare (`104.21.43.176`, `172.67.182.164`), y de ahí al
origen. Los bundles llevan hash en el nombre, así que son inmutables y no dan
problema.

> **Las rutas de la API salían sin cabecera de caché.** La regla de `no-cache`
> del `.htaccess` va por extensión (`.html`, `.json`) y `/api/pages/quienes-somos`
> no tiene ninguna, así que la respuesta viajaba sin instrucciones y Cloudflare
> aplicaba su heurística: llegó a servir la versión anterior de una página ya
> desplegada mientras el origen devolvía la nueva. Se diagnosticó porque
> `/api/pages/quienes-somos` daba contenido viejo y `…?x=1` —otra clave de
> caché— daba el nuevo; pidiéndoselo al origen por IP también salía el nuevo.
> `Response::json()` manda ahora `no-store` en todas las respuestas.

**Las imágenes no llevan hash.** Salen de `public/` con `max-age` de 30 días, así
que al sustituir una foto el borde sigue sirviendo la vieja hasta que caduque.
Mientras siga así, cualquier cambio de imagen exige **purgar la caché de
Cloudflare**. Comprobación rápida: pedir el archivo con `?v=algo` —otra clave de
caché— y comparar el tamaño con el de la URL limpia.

---

## Estructura

```
frontend/
  public/assets/
    csmx/                 Fotografía y logotipos de Coating Systems MX
    marcas/               Logotipos de PPG
    ppg/ video/           Imagen y vídeo del hero (+ su póster)
    fuentes/              Tipografía Noto Sans autoalojada
    uploads/              Lo que se sube desde el panel (sin ejecución de PHP)
  scripts/                sync-content.mjs · generar-sitemap.mjs
  src/
    styles/tokens.css     ~160 tokens extraídos del sistema en vivo de PPG
    styles/base.css       Reset, tipografía fluida, accesibilidad, reveal
    types/content.ts      Contrato de contenido (bloques, página, navegación)
    lib/api.ts            Cliente de la API con fallback local
    lib/useSeo.ts         Título, canónica y metadatos sociales por página
    lib/useReveal.ts      Animación de entrada por IntersectionObserver
    components/layout/    Header + mega-menú, Footer, botón de WhatsApp
    components/ui/        Container, Section, Button, Card, Badge, Breadcrumb…
    components/blocks/    Un componente por tipo de bloque + BlockRenderer
    pages/                ContentPage, MarketPage, BusinessLinePage, ColorsPage…
    content/              Copia de backend/data (fallback, se regenera)
    admin/                Panel — se carga sólo al entrar en /admin
      schema.ts           Campos editables por tipo de bloque
      api.ts              Cliente autenticado (CSRF, sin fallback)
      useEditable.ts      Carga, detección de cambios y guardado
      components/         BlockForm, campos, MediaPicker
      screens/            Páginas, Ajustes, Catálogo, Medios, Mensajes…
backend/
  public/index.php        Front controller, CORS y rutas
  src/Router.php          Router con parámetros {slug}
  src/Response.php        Respuestas JSON
  src/Auth/Auth.php       Sesión, CSRF y límite de intentos
  src/Validator/          ContentValidator — barrera antes de escribir
  src/Repository/         ContentRepository — única clase que toca almacenamiento
  src/Mailer/             ContactMailer — aviso de cada mensaje recibido
  src/Controller/         Content, Contact, Auth, Admin, Media, Notification
  config/                 users.json (hash bcrypt) y notifications.json
  data/                   Contenido; .backups/ guarda 10 versiones por archivo
  storage/                Mensajes recibidos e intentos de acceso
deploy/
  deploy.ps1              Compilar, ensamblar y subir por FTP
  htaccess-root           SPA + /api + caché + seguridad
  htaccess-deny           Bloqueo de directorios internos
  htaccess-uploads        Sin ejecución de PHP en las subidas
fuentes/                  Material en bruto (vídeos sin comprimir). No se despliega.
```

`backend/data` es la fuente de verdad. `npm run sync:content --prefix frontend`
la copia a `frontend/src/content`; el build lo hace automáticamente.

---

## API

| Método | Ruta | Devuelve |
|---|---|---|
| GET | `/api/health` | Estado del servicio |
| GET | `/api/site` | Logo, redes sociales, copyright |
| GET | `/api/navigation` | Mega-menú, footer y enlaces legales |
| GET | `/api/pages` | Slugs disponibles |
| GET | `/api/pages/{slug}` | Página como lista de bloques |
| GET | `/api/business-lines` | Las tres líneas de producto |
| GET | `/api/business-lines/{slug}` | Una línea |
| GET | `/api/markets` | Los seis sectores de mercado |
| GET | `/api/colors` | Carta de color: familias y 83 referencias |
| GET | `/api/featured-products` | Productos de la portada |
| POST | `/api/contact` | Alta de mensaje de contacto |

Sesión y panel (todo lo de `/api/admin/*` exige sesión y token CSRF):

| Método | Ruta |
|---|---|
| GET | `/api/auth/session` |
| POST | `/api/auth/login` · `logout` · `password` |
| GET · PUT · DELETE | `/api/admin/pages[/{slug}]` |
| PUT | `/api/admin/navigation` · `site` · `business-lines` |
| PUT | `/api/admin/markets` · `colors` · `featured-products` |
| GET · PUT | `/api/admin/notifications` (+ `POST …/test`) |
| GET · DELETE | `/api/admin/messages[/{id}]` |
| GET · POST · DELETE | `/api/admin/media[/{name}]` |

La lectura del panel usa las rutas públicas —edita exactamente lo que se está
publicando— y sólo la escritura pasa por `/api/admin/…`.

---

## Modelo de contenido

Cada página es una lista ordenada de bloques tipados, igual que en el CMS
headless del sitio original:

```json
{
  "slug": "color",
  "seo": { "title": "…", "description": "…" },
  "blocks": [
    { "type": "hero", "variant": "split", "title": "…" },
    { "type": "contentBanner", "theme": "brand", "imageSide": "right", "…": "…" }
  ]
}
```

Tipos disponibles: `hero`, `heroSlider`, `richText`, `cardGrid`, `mediaGrid`,
`contentBanner`, `videoFeature`, `statGrid`, `timeline`, `ctaBanner`,
`linkList`, `quote`, `contactForm`, `specList`, `brandStrip`, `colorShowcase`,
`productShowcase`, `colorCarousel`.

Los dos últimos no llevan contenido propio: se insertan y ya, porque leen de
`featured-products.json` y de `colors.json`. Se editan desde el grupo
**Catálogo** del panel, no desde la página que los muestra.

**Destacar un elemento.** En `cardGrid` y `statGrid`, marcar `highlight` en un
elemento lo rellena en azul de marca. Es el recurso que rompe la monotonía de la
cuadrícula: **uno por grupo**, no más.

**Sin bordes de color.** Las tarjetas y los mosaicos se diferencian por
**relleno**, nunca por una barra de acento: tinte `#EDF3F6` las neutras y
`#0078A9` la destacada. Es una decisión firme del cliente — no reintroducir
barras laterales de color en ningún bloque nuevo.

### Señas visuales de PPG (medidas en su sitio)

| | PPG | Aplicado |
|---|---|---|
| Radio de botón | 4 px | `--radius-s: 4px` |
| Radio de tarjeta | 0 px | 4 px |
| Titulares | caja baja, tracking `normal` | igual |
| Cabecera | 120 px | 100 px |
| Sombra de tarjeta | `5px 8px 22px rgba(0,0,0,.25)` | igual en la destacada |

El sistema es de **esquinas casi rectas**. El redondeo generoso (16–32 px) se
recortó a 4–6 px justamente porque alejaba el sitio del lenguaje de PPG.

**Muestrario de color.** Las referencias de `colorShowcase` usan códigos **RAL**,
un estándar público del recubrimiento en polvo. No se inventan códigos de
producto PPG ni Berel: la carta real se pide por el botón del bloque.

**Nombre del RAL.** Cada referencia con equivalencia RAL lleva además `ralName`
—`Traffic White`, `Jet Black`—, el nombre con el que **PPG publica ese RAL en su
propio catálogo** (`powdercoatings.ppg.com/collections/ral-colors`, 820 títulos
que dan 191 RAL). Se rellenaron 71 de las 83 referencias. Las 12 restantes se
quedan vacías a propósito y así deben seguir mientras no haya fuente:

- 10 no traen RAL en el catálogo del cliente.
- `PCTH73127` es RAL 9006, que PPG sólo publica como «Bonded Silver Met»:
  nombre de producto suyo, no del estándar.
- `PCTH40151` dice RAL 6814, que **no existe** en el catálogo RAL de PPG.
  Está pendiente de contrastar contra el PDF.

Los códigos del catálogo mexicano (`PCTH…`, `PCFH…`) **no son los de la tienda
de PPG** (`PCTA…`): buscar `PCTH80109` allí devuelve cero resultados. Por eso la
carta no usa las imágenes de muestra de PPG —serían de otra línea de producto— y
sigue pintando el color por su hexadecimal.

**Añadir un tipo nuevo** son cuatro pasos: extender `Block` en
`src/types/content.ts`, escribir el componente en `src/components/blocks/`,
registrarlo en el `switch` de `BlockRenderer.tsx` y describir sus campos en
`src/admin/schema.ts`. Si además debe poder guardarse desde el panel, el tipo
tiene que estar en `BLOCK_TYPES` de `ContentValidator.php`: lo que no reconoce,
lo rechaza con un 422.

---

## Camino al CMS

`ContentRepository` es la única clase que toca el almacenamiento. Para pasar a
base de datos basta con reimplementar sus métodos (o crear un
`MySqlContentRepository` con la misma firma): controladores, router y frontend
no cambian. El contrato de la API ya es el que consumirá el panel de
administración.

---

## Sistema de diseño

Tokens extraídos del sistema en vivo de PPG, conservando su nomenclatura de tres
capas (`--bg-*`, `--fg-*`, `--border-*`).

| Rol | Valor |
|---|---|
| Marca | `#0078A9` · hover `#026A94` · active `#044D6B` |
| Marca suave | `#EDF3F6` · `#CFE4ED` |
| Menú / Footer | `#252F3D` · `#181E28` |
| Texto | `#081520` · `#3B4A54` · `#6B7886` |
| Tipografía | Noto Sans 300–700 |
| Contenedor | 1440 px, padding 40 px (16 px en móvil) |

### Marca del cliente

| | |
|---|---|
| Rojo del logotipo | `#EE272C` |
| Azul del logotipo | `#3D72B8` |
| Azul principal (PPG) | `#0078A9` |

El isotipo se vectorizó desde el PNG original de 153×173 px del cliente
(`deploy` de `frontend/public/assets/csmx/logo-isotipo.svg`): se separó la
máscara de cada color, se siguió el contorno encadenando aristas de píxeles y
se simplificó con Douglas-Peucker. `logo.svg` es el logotipo horizontal con
tipografía para el encabezado.

**Falta el archivo vectorial original.** Conviene pedírselo al cliente (AI, EPS
o SVG) y sustituirlo desde el panel; el trazado actual es fiel pero derivado.

### Páginas

`/` · `/mercados` · `/quienes-somos` · `/contacto` · `/colores`, la plantilla
`/mercados/:slug` para los seis sectores y `/productos/:slug` para las tres
líneas: pintura en polvo, pintura líquida y pre tratamientos metálicos.

**Las cifras de cada línea van en `business-lines.json`, no en la plantilla.**
Estaban escritas dentro de `BusinessLinePage.tsx`, así que las tres páginas
enseñaban las mismas —«25 kg por caja» salía también en pintura líquida, donde
no significa nada—. Ahora cada línea trae su `stats` y la que no las tiene no
monta el bloque: un hueco antes que un dato prestado de otra. Hoy sólo la de
polvo las lleva.

### Mejoras sobre el original

- Escala tipográfica fluida con `clamp()` en lugar de saltos por breakpoint.
- Tarjetas con elevación, `translateY` en hover y flecha ↗ animada.
- Aparición al hacer scroll; el contenido ya visible no espera al observer, y
  el estado oculto vive bajo `html.js` para que sin JavaScript siga viéndose.
- Mega-menú con overlay difuminado, navegable por teclado y cerrable con `Esc`.
- Imágenes con `aspect-ratio` fijo, carga diferida y skeleton — sin saltos de
  layout.
- Jerarquía `h1`→`h6` correcta (la portada original no tiene `h1`), `skip-link`
  y anillo de foco de marca.
- Modo oscuro con persistencia en `localStorage`.
- Formulario de contacto funcional (el original sólo enlaza a otras páginas).
