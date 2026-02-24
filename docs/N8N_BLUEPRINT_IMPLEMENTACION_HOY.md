# N8N Blueprint — Pipeline Operativo Ecuador a la Carta

> **Estado**: Activo | **Versión**: 1.0 | **Fecha**: 2026-02-24

## Pipeline Completo (orden estricto)

```
[Trigger: Schedule/Webhook]
         │
         ▼
[1. Generar Contenido — xAI Grok]
         │
         ▼
[2. Quality Gate v1 — JSON válido]
    └─ FAIL → STOP + Alerta Telegram
         │
         ▼
[3. Enrich SEO — node scripts/enrich-seo.mjs]
         │
         ▼
[4. Generar Imagen — HuggingFace FLUX.1-schnell]
         │
         ▼
[5. Quality Gate v2 — imagen válida]
    └─ FAIL → continuar sin imagen (log warning)
         │
         ▼
[6. Commit/Push a GitHub (recipes.json o posts.json)]
         │
         ▼
[7. Notificar éxito — Telegram / WhatsApp]
```

---

## Nodo 1 — Generar Contenido

**Tipo**: HTTP Request (xAI Grok)
**Modelo**: `grok-3` (publicación completa) o `grok-3-mini` (slug/nombrador)

```
POST https://api.x.ai/v1/chat/completions
Authorization: Bearer {{$env.XAI_API_KEY}}
Content-Type: application/json

Body: { "model": "grok-3", "messages": [...] }
```

**Salida esperada**: JSON completo con todos los campos requeridos por el Quality Gate.

---

## Nodo 2 — Quality Gate v1 (JSON válido)

**Tipo**: Execute Command (n8n)
**Comando**:
```bash
cd /app/recetas-ecuador && node scripts/validate-content.mjs
```

**Política de fallo**:
- Exit code `1` → **STOP** workflow + notificar Telegram con el error
- Exit code `0` → continuar al siguiente nodo

**Variables**:
```
Timeout: 30s
On Error: Stop Workflow
```

---

## Nodo 3 — Enrich SEO

**Tipo**: Execute Command (n8n)
**Comando**:
```bash
cd /app/recetas-ecuador && node scripts/enrich-seo.mjs
```

**Comportamiento**:
- Idempotente: si ya hay `meta_title`, `meta_description`, `og_image` → no hace nada
- Si faltan → los genera y guarda backup `.bak`
- Nunca falla el workflow (siempre exit 0)

---

## Nodo 4 — Generar Imagen (HuggingFace FLUX.1-schnell)

**Tipo**: HTTP Request
**Endpoint**:
```
POST https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell
Authorization: Bearer {{$env.HUGGINGFACE_API_KEY}}
Content-Type: application/json

Body: { "inputs": "<prompt>" }
```

**Prompt para recetas**:
```
Fotografía profesional del plato tradicional ecuatoriano "{title}" de {region},
vista superior o plano tres cuartos alto, colores vibrantes y naturales,
sin personas, sin texto, sin logos, fondo madera rústica o tela andina,
vajilla artesanal ecuatoriana, iluminación natural lateral, 4K
```

**Prompt para posts de turismo**:
```
Fotografía de viaje y turismo profesional de Ecuador, {region}, {categoryStyle},
tema: "{title}", sin personas, sin texto, sin logos, colores vibrantes,
hora dorada, calidad editorial National Geographic, 4K
```

**Respuesta**: binario JPEG → convertir a base64 → subir a GitHub en `/images/{slug}.jpg`

---

## Nodo 5 — Quality Gate v2 (imagen)

**Tipo**: Code (JavaScript)
```javascript
// Verificar que la imagen fue generada y subida
const aiImageUrl = $input.first().json.ai_image_url;
if (!aiImageUrl || !aiImageUrl.startsWith('https://raw.githubusercontent.com')) {
  // Warning log — no detener el workflow
  console.warn('[QG2] Imagen IA no disponible — publicando sin imagen');
  return [{ json: { ...$input.first().json, _image_source: 'pending_ai' } }];
}
return [{ json: $input.first().json }];
```

**Política**: Soft fail — el workflow continúa pero sin imagen.

---

## Nodo 6 — Commit/Push a GitHub

**Tipo**: HTTP Request (GitHub Contents API)

**Recetas** — actualizar `recipes.json`:
```
PUT https://api.github.com/repos/LordRa2pat/recetas-ecuador/contents/recipes.json
Authorization: Bearer {{$env.GITHUB_TOKEN}}
Content-Type: application/json

Body: {
  "message": "feat(recetas): nueva receta {slug}",
  "content": "<base64 del JSON actualizado>",
  "sha": "<sha actual del archivo>"
}
```

**Posts** — actualizar `posts.json`:
```
PUT https://api.github.com/repos/LordRa2pat/recetas-ecuador/contents/posts.json
Authorization: Bearer {{$env.GITHUB_TOKEN}}
```

**IMPORTANTE**: Siempre obtener el SHA actual antes de hacer PUT:
```
GET https://api.github.com/repos/LordRa2pat/recetas-ecuador/contents/recipes.json
→ $.sha
```

---

## Nodo 7 — Notificación Éxito

**Telegram** (recomendado para admin):
```
✅ Nueva receta publicada: {title}
📍 Región: {region}
🔗 https://ecuadoralacarta.com/recipe.html?slug={slug}
🖼️ Imagen: {_image_source}
```

**WhatsApp** (opcional, a canal del equipo):
```
✅ Ecuador a la Carta | Nueva publicación: {title}
```

---

## Retries Recomendados

| Nodo | Retries | Delay | Acción si falla |
|------|---------|-------|-----------------|
| Generar Contenido | 2 | 30s | Abortar + Telegram |
| Quality Gate v1 | 0 | — | Abortar + Telegram |
| Enrich SEO | 0 | — | Continuar (no crítico) |
| Generar Imagen (HF) | 3 | 60s | Publicar sin imagen |
| Commit GitHub | 3 | 10s | Abortar + Telegram |

---

## Comandos Locales (Testing)

```bash
# 1. Correr Quality Gate
node scripts/validate-content.mjs

# 2. Enriquecer SEO
node scripts/enrich-seo.mjs

# 3. Verificar JSON
python -m json.tool recipes.json > /dev/null && echo "OK"
python -m json.tool posts.json > /dev/null && echo "OK"

# 4. Verificar sintaxis JS
node --check script.js

# 5. Test HuggingFace (requiere HF_TOKEN)
curl -X POST \
  -H "Authorization: Bearer $HUGGINGFACE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"inputs": "Fotografía profesional de plato ecuatoriano, 4K"}' \
  https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell \
  --output test_image.jpg
```

---

## Variables de Entorno Requeridas (n8n)

Configurar en `n8n → Settings → Environment Variables`:

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `XAI_API_KEY` | ✅ | xAI Grok — generación de contenido |
| `GITHUB_TOKEN` | ✅ | GitHub PAT — push de datos |
| `HUGGINGFACE_API_KEY` | ✅ | HuggingFace — generación de imágenes FLUX |
| `YT_API_KEY` | ⚠️ | YouTube — videos opcionales |
| `GMAPS_API_KEY` | ⚠️ | Google Places — lugares opcionales |

---

## Política de Fallo Global

```
Quality Gate falla → STOP inmediato → NO publicar nada
Imagen falla       → Publicar SIN imagen (no bloquear contenido)
GitHub falla       → Reintentar 3 veces → Si persiste: STOP + Telegram
```
