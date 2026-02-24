# Roadmap — Automatización Top 10 Recetas Ecuador a la Carta

> **Estado**: Activo | **Versión**: 1.0 | **Fecha**: 2026-02-24

## Objetivo

Posicionar `ecuadoralacarta.com` como la fuente de referencia en español para:
1. **Recetas ecuatorianas auténticas** — cocineros locales y diáspora
2. **Turismo gastronómico** — turistas nacionales e internacionales
3. **Información práctica** — precios reales, dónde comer, videos

---

## Audiencias Objetivo

| Audiencia | Perfil | Necesidad | Acción deseada |
|-----------|--------|-----------|----------------|
| **Local** 🇪🇨 | Ecuatoriano/a en Ecuador | Recetas auténticas, precios reales | Guardar receta, compartir WhatsApp |
| **Diáspora** ✈️ | Ecuatoriano/a fuera del país | Ingredientes sustitutos, nostalgia | Buscar sustitutos, compartir con familia |
| **Turista** 🗺️ | Viajero interesado en Ecuador | Qué comer, dónde ir, qué probar | Guardar lugar, planear viaje |

---

## Top 10 Recetas Prioritarias (SEO)

Basado en volumen de búsqueda estimado + representatividad cultural:

| # | Receta | Región | Audiencia | KW Principal |
|---|--------|--------|-----------|--------------|
| 1 | **Seco de Pollo** | Costa/Sierra | Local + Diáspora | "seco de pollo ecuatoriano" |
| 2 | **Llapingachos** | Sierra | Turista + Diáspora | "llapingachos ecuatorianos receta" |
| 3 | **Encebollado** | Costa | Local + Turista | "encebollado de pescado" |
| 4 | **Fanesca** | Sierra (Semana Santa) | Local + Diáspora | "fanesca ecuatoriana receta" |
| 5 | **Hornado** | Sierra | Local + Turista | "hornado quiteño receta" |
| 6 | **Fritada** | Sierra | Local | "fritada ecuatoriana" |
| 7 | **Caldo de Pata** | Sierra | Local | "caldo de pata ecuatoriano" |
| 8 | **Ceviche de Camarón** | Costa | Turista + Local | "ceviche de camaron ecuatoriano" |
| 9 | **Bolon de Verde** | Costa/Amazonia | Local + Diáspora | "bolon de verde receta" |
| 10 | **Caldo de Pollo** | Nacional | Local | "caldo de pollo ecuatoriano" |

---

## Pipeline de Publicación Automatizada

```
Trigger (Schedule/Webhook)
  ↓
Nombrador (grok-3-mini) → selecciona siguiente receta
  ↓
Chef (grok-3) → genera JSON completo con todos los campos
  ↓
Quality Gate v1 (validate-content.mjs) → valida estructura
  ↓ (si falla: STOP + Telegram)
Enrich SEO (enrich-seo.mjs) → completa meta_title, meta_description, og_image
  ↓
YouTube API → busca 2-3 videos relacionados
  ↓
Google Places API → busca 3-5 restaurantes donde comerlo
  ↓
HuggingFace FLUX.1-schnell → genera imagen fotorrealista
  ↓
Quality Gate v2 → imagen válida
  ↓
Commit/Push → GitHub → Vercel auto-deploy
  ↓
Notificación Telegram
```

---

## KPIs Objetivo por Fase

### Fase 1 — Primeras 30 recetas (actual)
- [ ] 30 recetas publicadas
- [ ] 0 recetas sin `image_url`
- [ ] Quality Gate pasando al 100%
- [ ] SEO básico (meta_title + meta_description) en todas

### Fase 2 — Primeras 60 recetas (próximo mes)
- [ ] 60 recetas totales
- [ ] Schema.org Recipe en todas (ya implementado vía `injectSEO()`)
- [ ] Google Search Console configurado
- [ ] 10+ keywords posicionando en página 1

### Fase 3 — 100+ recetas (3 meses)
- [ ] 100 recetas
- [ ] Google Analytics 4 con eventos (trackEvent ya implementado)
- [ ] 1,000 visitas/mes orgánicas
- [ ] WhatsApp compartido 100+ veces/mes

---

## Estructura de Datos Actual

### recipes.json — Campos obligatorios (Quality Gate)
- `slug`, `title`, `description` (≥80 chars)
- `ingredients[]`, `instructions[]` (con texto válido)
- `image_url`, `region`

### recipes.json — Campos SEO (enrich-seo)
- `meta_title` (≤60 chars) | `meta_description` (≤155 chars) | `og_image`

### recipes.json — Campos enriquecidos (workflows n8n)
- `keywords[]`, `faqs[]`, `tips[]`
- `youtube_videos[]`, `places[]`
- `tourism_route`, `international_substitutes[]`
- `estimated_cost`, `target_audience`

---

## Reglas Editoriales

1. **No personas en imágenes** — solo platos, paisajes, lugares
2. **No texto sobre imágenes** — limpio para redes sociales
3. **Descripción ≥ 80 chars** — mínimo para SEO
4. **Instructions con texto real** — cada paso ≥ 5 chars
5. **Slugs únicos** — entre recetas y posts globalmente
