# Setup Guide — RECETAS-AI-Auto-Publisher v3

## Requisitos previos

- n8n self-hosted (v1.30+) — ya configurado en EasyPanel
- Cuenta GitHub con acceso al repo `LordRa2pat/recetas-ecuador`
- Cuenta xAI con créditos activos
- Proyecto Google Cloud con facturación activada

---

## 1. Activar APIs en Google Cloud Console

### 1.1 YouTube Data API v3
1. Ir a [console.cloud.google.com](https://console.cloud.google.com/)
2. APIs & Services → Enable APIs → buscar **YouTube Data API v3** → Enable
3. Credentials → Create Credentials → API Key
4. (Opcional) Restringir la key a YouTube Data API v3
5. **Quota gratuita:** 10,000 unidades/día
   - `search.list` cuesta 100 unidades
   - `videos.list` cuesta 1 unidad
   - Con 2 ejecuciones/día usas ~200-210 unidades (2% de la quota)

### 1.2 Google Places API (New)
1. En el mismo proyecto → Enable APIs → buscar **Places API (New)** → Enable
   ⚠️ Asegúrate de activar **Places API (New)**, no la versión legacy
2. Usar la misma API Key o crear una separada
3. (Recomendado) En Billing → Budget → crear presupuesto de $5/mes con alertas
4. **Costo estimado:** 3 búsquedas por receta × $0.017 = $0.051/receta

---

## 2. Obtener GitHub Token

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Nombre: `n8n-recetas-bot`
4. Scope: marcar **repo** (incluye `contents:write`)
5. Expiration: sin expiración o 1 año
6. Copiar el token (solo se muestra una vez)

---

## 3. Configurar Variables en n8n

1. n8n → Settings (engranaje) → **Environment Variables**
2. Agregar cada variable:

| Variable | Valor |
|---|---|
| `XAI_API_KEY` | `xai-...` |
| `GITHUB_TOKEN` | `ghp_...` |
| `YT_API_KEY` | `AIza...` |
| `GMAPS_API_KEY` | `AIza...` |
| `PEXELS_API_KEY` | (opcional) |

3. Guardar y **reiniciar n8n** para que las variables estén disponibles

---

## 4. Importar el Workflow v3

1. En n8n → Workflows → Import from File
2. Seleccionar `recetas_workflow_v3.json` del repositorio
3. El workflow se importa como **inactivo** (no empieza solo)
4. Verificar que todos los nodos carguen sin errores rojos
5. En el nodo "Cada 12 Horas" → ajustar horario si se desea

### Verificación de nodos
Después de importar, revisar que estos nodos no tengan errores:

- **GET slugs existentes** → debe conectarse a GitHub OK
- **YouTube: Buscar Videos** → la URL tiene `{{$env.YT_API_KEY}}`
- **Places: Ciudad 1/2/3** → los headers tienen `{{$env.GMAPS_API_KEY}}`
- **Chef Redactor v3** → el header tiene `{{$env.XAI_API_KEY}}`

---

## 5. Ejecutar el Workflow Manualmente (Prueba)

1. Abrir el workflow importado
2. Clic en el nodo **"Cada 12 Horas"** → **"Execute Node"**
3. Verificar que cada nodo pase sin error (indicador verde)
4. Si un nodo falla → ver el output para diagnosticar

### Errores comunes

| Error | Causa | Solución |
|---|---|---|
| `403 Forbidden` en xAI | API key inválida o sin créditos | Renovar créditos en console.x.ai |
| `403` en GitHub | Token sin permisos | Verificar scope `repo` |
| `400` en Places API | API no activada o key incorrecta | Verificar en GCP Console |
| `403 quotaExceeded` en YouTube | Quota diaria agotada | Esperar hasta medianoche Pacific Time |
| `QUALITY_GATE_FAILED` | Receta mal generada por Grok | Reintentar — a veces Grok devuelve JSON incompleto |
| `DUPLICADO_SLUG` | Receta ya existe | Normal — el workflow aborta correctamente |

---

## 6. Activar el Workflow

Una vez probado exitosamente:
1. Clic en el toggle **"Active"** en la parte superior
2. El workflow correrá automáticamente cada 12 horas
3. Cada ejecución exitosa hará un commit a GitHub → rebuild en Vercel

---

## 7. Monitoreo

### Ver ejecuciones
- n8n → Executions → filtrar por workflow `RECETAS-AI-Auto-Publisher-v3`

### Logs de éxito esperados en la consola
```
Quality Gate OK: locro-de-papa | places: 5 | videos: 2
```

### Commit en GitHub
Cada receta publicada crea un commit con mensaje:
```
feat(recetas): agregar locro-de-papa [ID:15] 5 lugares, 2 videos — auto v3
```

---

## 8. Estructura de Costos Mensual Estimada

| Servicio | Unidad | Costo/receta | Al mes (60 recetas) |
|---|---|---|---|
| Grok grok-3-mini | tokens | ~$0.001 | ~$0.06 |
| Grok grok-3 | tokens | ~$0.04 | ~$2.40 |
| YouTube API | unidades | gratis | $0 |
| Google Places | requests | ~$0.051 | ~$3.06 |
| Wikimedia | requests | gratis | $0 |
| **TOTAL** | | **~$0.09** | **~$5.52** |

---

## 9. Agregar Variables Pexels/Unsplash (Opcional)

Si Wikimedia no encuentra imagen para un plato específico, puedes agregar
un nodo fallback con Pexels:

**Pexels API:**
```
GET https://api.pexels.com/v1/search?query=[image_keywords]&per_page=1
Headers: Authorization: {{$env.PEXELS_API_KEY}}
```
Retorna: `photos[0].src.large2x` → usar como `image_url`

**Unsplash API:**
```
GET https://api.unsplash.com/photos/random?query=[image_keywords]&orientation=landscape
Headers: Authorization: Client-ID {{$env.UNSPLASH_ACCESS_KEY}}
```
Retorna: `urls.regular` → usar como `image_url`
Y: `user.name`, `links.html`, `user.links.html` → usar para `image_credit`

---

## 10. Front-end: Secciones v3 en recipe.html

Las siguientes secciones se muestran automáticamente si el campo existe:

| Campo en JSON | Sección visible | Lógica |
|---|---|---|
| `places[]` | "📍 Dónde comerlo en Ecuador" | Si `places.length > 0` |
| `youtube_videos[]` | "▶️ Tutoriales en YouTube" | Si `youtube_videos.length > 0` |
| `image_credit` | Crédito sobre imagen | Si objeto existe |
| `international_substitutes[]` | "✈️ Ingredientes en el Extranjero" | Si array > 0 |
| `tourism_route` | "🗺️ Ruta Gastronómica 2026" | Si string existe |

Para recetas antiguas (sin los campos nuevos), el sitio funciona exactamente igual.
