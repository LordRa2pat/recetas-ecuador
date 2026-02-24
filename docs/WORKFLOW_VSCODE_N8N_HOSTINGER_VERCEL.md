# Workflow Técnico — VSCode + n8n + Hostinger + Vercel

> **Estado**: Activo | **Versión**: 1.0 | **Fecha**: 2026-02-24

## Arquitectura General

```
┌─────────────┐    git push    ┌──────────────┐   auto-deploy   ┌──────────────┐
│   VSCode    │ ─────────────▶ │    GitHub    │ ───────────────▶ │    Vercel    │
│  (local)    │                │ LordRa2pat/  │                  │ ecuadoralac  │
└─────────────┘                │ recetas-ec.. │                  │ arta.com     │
                               └──────┬───────┘                  └──────────────┘
                                      │
                               API (Contents)
                                      │
                               ┌──────▼───────┐
                               │     n8n      │
                               │ (Hostinger   │
                               │  VPS/Cloud)  │
                               └──────────────┘
```

---

## Flujo 1: Desarrollo Manual (VSCode → GitHub → Vercel)

### Cuándo usar
- Cambios en `script.js`, `*.html`
- Actualización de `scripts/*.mjs`
- Modificación de docs

### Pasos

```bash
# 1. Verificar calidad antes de commit
node scripts/validate-content.mjs   # Quality Gate
node --check script.js              # Sintaxis JS

# 2. Enriquecer SEO si se añadieron recetas/posts manualmente
node scripts/enrich-seo.mjs

# 3. Commit y push
git add scripts/ docs/ script.js .env.example
git commit -m "feat(scripts): Quality Gate v2 + Auto-SEO + trackEvent"
git push origin master

# 4. Vercel detecta el push y hace auto-deploy (2-3 min)
# Verificar en: https://vercel.com/dashboard
```

### Auto-deploy Vercel
- Trigger: cualquier push a `master`
- Branch de producción: `master`
- Build command: (ninguno — sitio estático)
- Output: archivos en raíz del repo

---

## Flujo 2: Automatización n8n → GitHub → Vercel

### Cuándo usa
- Publicación automática de recetas/posts
- Schedule: configurable (ej: 2 recetas/día)

### Pasos del workflow n8n

```
1. n8n genera contenido (xAI Grok)
2. n8n ejecuta Quality Gate: node scripts/validate-content.mjs
3. n8n ejecuta Enrich SEO: node scripts/enrich-seo.mjs
4. n8n genera imagen (HuggingFace FLUX.1-schnell)
5. n8n sube imagen a /images/{slug}.jpg vía GitHub API
6. n8n actualiza recipes.json o posts.json vía GitHub API PUT
7. GitHub recibe el PUT → dispara webhook → Vercel hace auto-deploy
```

### Comandos n8n (Execute Command)

```bash
# Quality Gate
cd /ruta/al/repo && node scripts/validate-content.mjs

# Enrich SEO
cd /ruta/al/repo && node scripts/enrich-seo.mjs
```

> **Nota**: Configurar la ruta correcta según donde esté clonado el repo en el VPS de Hostinger.

---

## Variables de Entorno

### En n8n (Settings → Environment Variables)

```
XAI_API_KEY          = xai-...
GITHUB_TOKEN         = github_pat_...
HUGGINGFACE_API_KEY  = hf_...
YT_API_KEY           = AIza...  (opcional)
GMAPS_API_KEY        = AIza...  (opcional)
```

### En Vercel (Settings → Environment Variables)

No se requieren variables de entorno — el sitio es completamente estático.
Los datos (`recipes.json`, `posts.json`, `price_db.json`) se sirven como archivos estáticos.

### Local (.env) — NO commitear

Crear `.env` local copiando de `.env.example`:
```bash
cp .env.example .env
# Editar .env con valores reales
# .env está en .gitignore
```

---

## Repositorio GitHub

| Item | Valor |
|------|-------|
| Repo | `LordRa2pat/recetas-ecuador` |
| Branch prod | `master` |
| Branch dev | (no existe — directo a master) |
| Auto-deploy | Vercel webhook conectado |

### Archivos clave del repo

```
recetas-ecuador/
├── index.html, recipe.html, blog.html, post.html  ← Frontend
├── script.js                                        ← Lógica JS (v7)
├── recipes.json                                     ← Datos recetas
├── posts.json                                       ← Datos posts/turismo
├── price_db.json                                    ← Precios ingredientes
├── scripts/
│   ├── validate-content.mjs                         ← Quality Gate v2
│   └── enrich-seo.mjs                               ← Auto-SEO
├── docs/
│   ├── N8N_SETUP.md
│   ├── N8N_BLUEPRINT_IMPLEMENTACION_HOY.md
│   ├── ROADMAP_AUTOMATIZACION_TOP10_RECETAS_EC.md
│   └── WORKFLOW_VSCODE_N8N_HOSTINGER_VERCEL.md
├── images/                                          ← Imágenes generadas por IA
│   └── posts/                                       ← Imágenes posts turismo
└── .env.example                                     ← Template de variables
```

---

## Comandos de Verificación Local

```bash
# 1. Quality Gate completo
node scripts/validate-content.mjs

# 2. Enrich SEO (idempotente)
node scripts/enrich-seo.mjs

# 3. Verificar JSONs
python -m json.tool recipes.json > /dev/null && echo "recipes.json OK"
python -m json.tool posts.json > /dev/null && echo "posts.json OK"
python -m json.tool price_db.json > /dev/null && echo "price_db.json OK"

# 4. Verificar sintaxis JS
node --check script.js && echo "script.js OK"

# 5. Todos en uno
node scripts/validate-content.mjs && \
node scripts/enrich-seo.mjs && \
node --check script.js && \
python -m json.tool recipes.json > /dev/null && \
python -m json.tool posts.json > /dev/null && \
echo "✅ Todas las validaciones pasaron"
```

---

## Troubleshooting Común

| Problema | Causa | Solución |
|----------|-------|----------|
| `401 Bad credentials` en n8n | GITHUB_TOKEN expiró | Generar nuevo token en github.com/settings/tokens |
| `node: not found` en n8n | Node.js no instalado en VPS | `apt install nodejs npm` |
| Quality Gate falla por description corta | Contenido generado incompleto | Reintentar Grok o editar manualmente |
| Vercel no despliega | Push no llegó a master | Verificar `git push origin master` |
| Imagen no aparece en sitio | URL de GitHub raw incorrecta | Verificar ruta en `recipes.json` → `image_url` |
