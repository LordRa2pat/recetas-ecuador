# 🌐 Reglas Globales del Proyecto — Ecuador a la Carta

> **Sitio**: [ecuadoralacarta.com](https://ecuadoralacarta.com)
> **Repositorio**: `LordRa2pat/recetas-ecuador`
> **Stack**: HTML estático + TailwindCSS CDN + Vanilla JS (ES Modules) + Vercel

---

## 1. 🏗️ Arquitectura del Proyecto

### Estructura de archivos

```
recetas-ecuador/
├── index.html              # Landing / portada
├── recipe.html             # Detalle de receta (SPA-like, carga por ?slug=)
├── recipes.html            # Listado / catálogo con filtros
├── blog.html               # Listado de artículos de turismo
├── post.html               # Detalle de artículo de blog
├── menu-semanal.html       # Menú semanal aleatorio
├── nosotros.html           # Sobre nosotros
├── contact.html            # Contacto (Formspree)
├── privacy.html / terms.html
├── script.js               # Router + lógica principal (1600+ líneas)
├── js/
│   ├── data.js             # Carga de JSON (recipes, posts, price_db)
│   ├── render.js           # Funciones de renderizado (cards, grids, FAQs)
│   ├── seo.js              # Meta tags dinámicos, JSON-LD, Open Graph
│   ├── prices.js           # Comparativa de precios (Tuti vs Supermaxi)
│   ├── i18n.js             # Internacionalización ES/EN
│   ├── utils.js            # Helpers (escapeHtml, timeToISO8601)
│   └── ads.js              # Slots de AdSense
├── i18n/                   # Archivos JSON de traducción (es.json, en.json)
├── recipes.json            # Base de datos de recetas (fuente de verdad)
├── posts.json              # Base de datos de posts del blog
├── price_db.json           # Base de datos de precios de ingredientes
├── images/                 # Imágenes hospedadas en GitHub raw
├── n8n-receiver.js         # CLI bridge para insertar recetas en dev/test
├── scripts/                # Scripts utilitarios (enrich-seo, validate, etc.)
├── docs/                   # Documentación de n8n, roadmap, setup
├── .env / .env.example     # Variables de entorno (NO subir al repo)
├── AGENTS.md               # Reglas específicas para n8n workflow agent
└── sitemap.xml / robots.txt
```

### Principios de arquitectura

- **Static-first**: Todo el sitio son archivos HTML/JS/CSS estáticos servidos por Vercel.
- **Client-side rendering**: Los datos se cargan como JSON plano y se renderizan dinámicamente en el navegador.
- **Modular JS con ES Modules**: Los archivos JS usan `import/export`. El `script.js` principal importa módulos de `js/`.
- **Sin framework ni bundler**: No usar React, Vue, Vite, Next.js, ni ningún bundler. El sitio funciona con imports nativos del navegador.
- **Router basado en pathname**: Al final de `script.js` hay un IIFE que detecta la página actual y llama al `init*()` correspondiente.

---

## 2. 🎨 Diseño y Estilo

### TailwindCSS (CDN)

- Se usa **TailwindCSS via CDN** (`<script src="https://cdn.tailwindcss.com">`).
- La configuración personalizada se define inline en cada HTML dentro de `<script>tailwind.config = {...}</script>`.
- **NO** instalar Tailwind como dependencia npm ni usar PostCSS.

### Paleta de colores obligatoria

| Token        | Hex       | Uso                              |
|:-------------|:----------|:---------------------------------|
| `ec-gold`    | `#DCA011` | Acentos, CTAs, stripe            |
| `ec-blue`    | `#14213D` | Header, texto principal, fondos  |
| `ec-red`     | `#9A1B22` | Stripe, acentos secundarios      |
| `ec-green`   | `#284B34` | Badges ecológicos / orgánicos    |
| Background   | `#FDFBF7` | Fondo general (crema suave)      |

### Tipografía

- **Sans**: `"DM Sans"`, system-ui, sans-serif
- **Serif**: `"Playfair Display"`, Georgia, serif
- **UI / Body**: `"Inter"` (cargada desde Google Fonts)
- Todas las fuentes se cargan con `rel="preconnect"` a `fonts.googleapis.com`.

### Componentes visuales clave

- **`.ec-stripe`**: Barra tricolor (gold→blue→red) de 4px en header/footer.
- **`.ec-title-bar`**: Barra decorativa debajo de títulos de sección (56px, gradiente tricolor).
- **`.ec-card-3d`**: Cards con sombra 3D y efecto hover `translateY(-8px) scale(1.02)`.
- **`.nav-dropdown`**: Menú desplegable que se muestra con hover en `.nav-item`.
- **`.ad-slot`**: Contenedor de publicidad con glassmorphism.
- **`.ing-checkbox`**: Checkbox custom para ingredientes.

### Diseño responsive

- Mobile-first, breakpoints estándar de Tailwind (`sm:`, `md:`, `lg:`).
- Header sticky con backdrop-blur.
- Menú móvil toggle (`#nav-mobile`).
- Grids adaptativos: 1 columna mobile → 2 sm → 3-4 lg.

---

## 3. 📊 Modelo de Datos

### `recipes.json` — Esquema de receta

```json
{
  "id": 1,
  "title": "Nombre de la Receta",
  "slug": "nombre-de-la-receta",
  "description": "Descripción breve",
  "category": "Sopas | Platos Fuertes | Mariscos | Postres | Bebidas | Desayunos | Entradas",
  "region": "Sierra | Costa | Amazonia | Galapagos",
  "difficulty": "Fácil | Media | Difícil",
  "servings": "4 porciones",
  "prep_time": "20 min",
  "cook_time": "40 min",
  "total_time": "1 hora",
  "ingredients": ["2 tazas de arroz", "1 lb de camarón"],
  "instructions": ["Paso 1...", "Paso 2..."],
  "tips": ["Consejo 1", "Consejo 2"],
  "keywords": ["ceviche", "costa", "mariscos"],
  "faqs": [{"q": "Pregunta?", "a": "Respuesta."}],
  "image_url": "https://raw.githubusercontent.com/.../image.jpg",
  "image_alt": "Descripción accesible de la imagen",
  "image_credit": {"source": "...", "author": "...", "license": "...", "url": "..."},
  "target_audience": "Local | Diáspora | Turista",
  "international_substitutes": [{"original": "...", "sustituto_usa": "...", "sustituto_europa": "..."}],
  "tourism_route": "Descripción ruta turística",
  "origin_cities": [{"city": "...", "province": "...", "region": "..."}],
  "places": [{"name": "...", "city": "...", "googleMapsUri": "...", "rating": 4.5}],
  "youtube_videos": [{"title": "...", "videoId": "...", "url": "...", "embed": "..."}],
  "created_at": "2026-02-15T10:30:00.000Z"
}
```

> [!IMPORTANT]
> Los `ingredients` pueden venir como **strings** o como **objetos** `{name, quantity, where_to_buy}`. El código en `prices.js > renderIngredient()` normaliza ambos formatos.

> [!IMPORTANT]
> Los `faqs` pueden venir como `{q, a}` o `{question, answer}`. Normalizar siempre a `{q, a}`.

### `posts.json` — Esquema de post de blog

```json
{
  "id": 1,
  "title": "Título del artículo",
  "slug": "titulo-del-articulo",
  "description": "Resumen",
  "content": "<p>HTML del contenido...</p>",
  "category": "Destinos | Aventura | Cultura | Rutas | Festividades | Naturaleza | Gastronomía",
  "region": "Sierra | Costa | Amazonia | Galapagos",
  "image_url": "https://...",
  "image_alt": "Descripción accesible de la imagen",
  "image_credit": {"source": "Wikimedia Commons", "author": "...", "license": "CC BY-SA", "url": "https://..."},
  "_image_source": "wikimedia_commons | unsplash_category | pexels | huggingface_ai | pending_ai",
  "_image_source_url": "https://commons.wikimedia.org/...",
  "_imagen_status": "ok | failed",
  "source": "Ministerio de Turismo Ecuador",
  "reading_time": "5 min",
  "keywords": ["quito", "turismo"],
  "faqs": [{"q": "Pregunta?", "a": "Respuesta."}],
  "featured": true,
  "date_published": "2026-02-26",
  "author": "Ecuador a la Carta",
  "created_at": "2026-01-20T..."
}
```

### `price_db.json` — Esquema de precios

```json
{
  "arroz": {
    "reference_price_min": 0.85,
    "reference_price_max": 1.25,
    "unit": "lb"
  }
}
```

---

## 4. 🔌 Integraciones y APIs

### n8n (Automatización de contenido)

- **Instancia**: Auto-hospedada en Easypanel.
- **Propósito**: Generación automatizada de recetas con Grok AI, enriquecimiento con YouTube/Places/imágenes.
- **Entrada → GitHub**: El workflow de n8n genera la receta y hace commit directo al `recipes.json` y `posts.json` vía GitHub API.
- **Reglas de n8n**: Ver `AGENTS.md` para reglas específicas del agente de workflows.
- **CLI local**: `n8n-receiver.js` es solo para testing local, NO para producción.

### APIs utilizadas (configurar en n8n)

| API                          | Variable de entorno     | Uso                                   |
|:-----------------------------|:------------------------|:--------------------------------------|
| xAI / Grok                  | `XAI_API_KEY`           | Generación de contenido de recetas    |
| GitHub                       | `GITHUB_TOKEN`          | Commit de JSON al repositorio         |
| YouTube Data API v3          | `YT_API_KEY`            | Videos tutoriales                     |
| Google Places API (New)      | `GMAPS_API_KEY`         | Restaurantes y lugares donde comer    |
| HuggingFace (FLUX.1-schnell) | `HUGGINGFACE_API_KEY`   | Generación de imágenes fotorrealistas |
| Pexels / Unsplash            | `PEXELS_API_KEY`        | Fallback de imágenes                  |

### Vercel (Hosting)

- Deploy automático desde la rama `main` de GitHub.
- No hay build step — se sirven los archivos estáticos directamente.
- Los archivos `.vercel/` y la configuración están ignorados por Git.

### Formspree (Formularios)

- Newsletter y contacto usan Formspree (`formspree.io/f/xnjbokvk`).

### AdSense (Monetización)

- Slots de publicidad integrados con `adsbygoogle` en todas las páginas.
- La lógica de inserción de ads en grids está en `js/ads.js`.

---

## 5. ✅ Convenciones de Código

### JavaScript

- **ES Modules nativos** (`import/export`). NO usar CommonJS (`require`) en código del frontend.
- **`'use strict'`** al inicio de cada módulo.
- **`var`** en muchos archivos existentes — mantener consistencia con el estilo del archivo que se edita.
- **Nombrado**: funciones `camelCase`, constantes `UPPER_SNAKE`.
- **Comentarios de sección**: `// ─── Nombre ───...` con líneas de guiones para separar secciones.
- **Sin TypeScript**: Todo el frontend es JavaScript plano.
- **Sin npm/node_modules para el frontend**: No hay `package.json` para el frontend, solo para scripts de Node.

### HTML

- Idioma: `<html lang="es">`.
- Accesibilidad: `aria-label`, `aria-current`, roles semánticos, skip links.
- IDs únicos y descriptivos para todas las secciones interactivas.
- Estructura: `<header>`, `<main id="main-content">`, `<footer>`.
- Cada página incluye esqueletos de carga (`animate-pulse`) que se reemplazan al cargar datos.

### SEO

- Meta tags dinámicos inyectados por `js/seo.js`: title, description, OG, Twitter Cards.
- JSON-LD (`schema.org/Recipe`, `schema.org/Article`) inyectados dinámicamente.
- `<link rel="canonical">` en cada página.
- `sitemap.xml` y `robots.txt` en la raíz.
- Una sola etiqueta `<h1>` por página.

---

## 6. 🖼️ Imágenes y Atribución de Fuentes

### Regla fundamental

> [!CAUTION]
> **Toda imagen obtenida de internet DEBE incluir la fuente/crédito.** Nunca publicar una imagen sin atribución. Esto aplica tanto a recetas como a posts del blog.

### Fuentes de imágenes (orden de prioridad)

| Prioridad | Fuente                         | Campo `_image_source`  | Requiere crédito   |
|:---------:|:-------------------------------|:-----------------------|:-------------------|
| 1️⃣        | **Wikimedia Commons / Wikipedia** | `wikimedia_commons`    | ✅ Obligatorio (autor, licencia, URL) |
| 2️⃣        | **Búsqueda en internet** (cualquier sitio web) | `web_search`           | ✅ Obligatorio (URL fuente original) |

> [!IMPORTANT]
> **Solo estas dos fuentes.** Primero buscar en Wikimedia/Wikipedia. Si no hay imagen adecuada, buscar en internet y guardar la URL de la página donde se encontró la imagen como atribución.

### Estructura de crédito en el JSON

Tanto `recipes.json` como `posts.json` usan la misma estructura:

#### Caso 1: Imagen de Wikimedia Commons
```json
{
  "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/...",
  "image_alt": "Fotografía del plato: Locro de Papa ecuatoriano",
  "image_credit": {
    "source": "Wikimedia Commons",
    "author": "NombreDelFotógrafo",
    "license": "CC BY-SA 4.0",
    "url": "https://commons.wikimedia.org/wiki/File:..."
  },
  "_image_source": "wikimedia_commons",
  "_image_source_url": "https://commons.wikimedia.org/wiki/File:..."
}
```

#### Caso 2: Imagen encontrada en internet
```json
{
  "image_url": "https://ejemplo.com/foto-plato.jpg",
  "image_alt": "Vista del Malecón 2000 en Guayaquil, Ecuador",
  "image_credit": {
    "source": "ejemplo.com",
    "author": "",
    "license": "",
    "url": "https://ejemplo.com/pagina-donde-encontre-la-foto"
  },
  "_image_source": "web_search",
  "_image_source_url": "https://ejemplo.com/pagina-donde-encontre-la-foto"
}
```

### Cómo se renderiza la atribución en el frontend

#### En recetas (`recipe.html`)
- **`renderImageCredit(recipe)`** en `js/render.js`: Muestra "Crédito de imagen: Autor vía Fuente — Licencia 🔗" debajo de la imagen hero.
- **`_image_source_url`** en `script.js > initRecipe()`: Si existe, renderiza un enlace con el hostname de la fuente dentro de `#image-credit`.

#### En posts del blog (`post.html`)
- **`#image-credit`** (línea 327 de `post.html`): Div oculto por defecto que se llena con la atribución.
- **`_image_source_url`** en `script.js > initPost()`: Si el post tiene `_image_source_url`, se renderiza un link "Foto: hostname.com 🔗" superpuesto sobre la imagen hero.

#### En cards de listado (`blog.html` / `index.html`)
- Las tarjetas de blog (`renderBlogCard()`) no muestran crédito inline — la atribución se ve al abrir el post completo.

### Flujo n8n para imágenes

El workflow de n8n sigue esta cascada al asignar imagen:

```
1. Wikimedia Commons / Wikipedia
   → Buscar foto real del plato/lugar (libre de personas)
   → Si disponible y no es YouTube thumbnail:
     → Asigna image_credit con source, author, license, url
     → _image_source = "wikimedia_commons"

2. Búsqueda en internet (fallback)
   → Si Wikimedia no tiene resultado adecuado
   → Buscar imagen en la web (Google Images, sitios de turismo, etc.)
   → Guardar la URL directa de la imagen + la URL de la página fuente
   → _image_source = "web_search"
   → _image_source_url = URL de la página donde se encontró
```

> [!WARNING]
> **Nunca usar thumbnails de YouTube como imagen de portada** — pueden contener personas y violar derechos. El workflow filtra URLs que contengan `ytimg.com` o `youtube.com`.

### Posts ya publicados sin imagen (`_imagen_status: "failed"`)

Muchos posts existentes tienen `image_url: null` y `_imagen_status: "failed"`. Para corregirlos:

1. **Buscar primero en Wikimedia Commons** una imagen que represente el destino/tema del post.
2. **Si no hay en Wikimedia**, buscar en internet una imagen apropiada y copiar tanto la URL de la imagen como la URL de la página fuente.
3. **Agregar los campos obligatorios** al objeto del post en `posts.json`:
   ```json
   {
     "image_url": "https://url-directa-de-la-imagen.jpg",
     "image_alt": "Descripción accesible del lugar/tema",
     "image_credit": {
       "source": "nombre-del-sitio.com",
       "author": "Autor si se conoce",
       "license": "Licencia si aplica",
       "url": "https://pagina-fuente-original.com/articulo"
     },
     "_image_source": "wikimedia_commons o web_search",
     "_image_source_url": "https://pagina-fuente-original.com/articulo",
     "_imagen_status": "ok"
   }
   ```
4. **Commit y push** a `main` para que Vercel sirva la imagen actualizada.

### Reglas de `image_alt`

- Debe describir el contenido visual, NO personas.
- Si la IA genera un alt con palabras como "chef", "persona", "cocinero", reescribirlo para describir solo el plato o el lugar.
- Formato recomendado: `"Fotografía del plato: {título} — comida ecuatoriana tradicional"` (recetas) o `"Vista de {lugar} en {provincia}, Ecuador"` (posts).

### Hospedaje de imágenes propias

- **Repositorio**: GitHub raw → `https://raw.githubusercontent.com/LordRa2pat/recetas-ecuador/main/images/`.
- **Nombrado**: `{slug}-receta-{descriptor}.jpg` (ej: `hornado-quiteno-receta-tradicional.jpg`).

---

## 7. 🌍 Internacionalización (i18n)

- Idiomas soportados: **Español (ES)** y **Inglés (EN)**.
- Los strings se cargan desde `i18n/es.json` e `i18n/en.json`.
- La preferencia se guarda en `localStorage` con clave `ec_lang`.
- El switcher se inyecta dinámicamente en el nav.
- Las recetas individuales pueden tener toggle ESP/ENG si hay traducción disponible.
- El helper `t(key)` en JavaScript devuelve el string traducido.

---

## 8. 💾 Almacenamiento Local (localStorage)

| Clave               | Uso                              |
|:---------------------|:---------------------------------|
| `ec_favorites`       | Array de slugs favoritos         |
| `ec_lang`            | Preferencia de idioma (es/en)    |
| `ec_rating_{slug}`   | Calificación por estrellas (1-5) |

---

## 9. 🚫 Reglas Absolutas — Lo que NUNCA hacer

1. ❌ **No instalar frameworks JS** (React, Vue, Angular, Svelte, etc.).
2. ❌ **No agregar bundlers** (Vite, Webpack, Rollup, Parcel).
3. ❌ **No instalar Tailwind como npm** — usar siempre el CDN.
4. ❌ **No modificar la paleta de colores** sin autorización explícita.
5. ❌ **No subir `.env` con valores reales** al repositorio.
6. ❌ **No romper la compatibilidad** del esquema JSON existente.
7. ❌ **No usar `innerHTML` con contenido de usuario** sin `escapeHtml()` (importar de `utils.js`).
8. ❌ **No crear nuevas páginas HTML** sin replicar el header/nav/footer y la estructura de Tailwind Config existente.
9. ❌ **No usar IDs genéricos** como "div1", "container" — usar IDs descriptivos.
10. ❌ **No eliminar los esqueletos de carga** (`animate-pulse`) — son necesarios para la percepción de velocidad.

---

## 10. ✅ Checklist para Cambios

Antes de hacer commit, verificar:

- [ ] Los colores nuevos usan tokens existentes (`ec-gold`, `ec-blue`, etc.).
- [ ] Los textos nuevos tienen traducciones en `i18n/es.json` e `i18n/en.json`.
- [ ] Los IDs de elementos interactivos son únicos y descriptivos.
- [ ] Los `<img>` tienen `alt` descriptivo.
- [ ] Los datos de receta respetan el esquema de `recipes.json`.
- [ ] Los ingredientes y FAQs están normalizados (strings / `{q, a}`).
- [ ] El SEO dinámico (`seo.js`) cubre la nueva página o sección.
- [ ] Funciona en mobile (probar breakpoints `sm:`, `md:`, `lg:`).
- [ ] La accesibilidad (`aria-*`, roles, `tabindex`) está presente.
- [ ] `escapeHtml()` se usa al renderizar texto dinámico.

---

## 11. 🚀 Deployment

```bash
# El deploy es automático al hacer push a main
git add .
git commit -m "feat: descripción del cambio"
git push origin main
# Vercel detecta el push y re-despliega automáticamente
```

> [!TIP]
> No hay build step — Vercel sirve los archivos directamente. Los cambios toman efecto en ~30 segundos.

---

## 12. 🔧 Scripts Útiles

| Script                        | Descripción                                      |
|:------------------------------|:-------------------------------------------------|
| `node n8n-receiver.js '{}'`   | Insertar receta de prueba en `recipes.json`      |
| `node scripts/enrich-seo.mjs` | Enriquecer metadatos SEO de recetas              |
| `node scripts/validate-content.mjs` | Validar integridad del contenido JSON      |
| `node scripts/smoke-test.mjs` | Smoke test del sitio                             |
| `python scrape_prices.py`     | Scrapear precios de supermercados                |
| `python update_costs.py`      | Actualizar `price_db.json`                       |

---

*Última actualización: Febrero 2026*
