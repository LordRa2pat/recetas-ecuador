#!/usr/bin/env node
/**
 * validate-content.mjs — Quality Gate v2
 * Ecuador a la Carta
 *
 * Uso:   node scripts/validate-content.mjs
 * Exit:  0 = OK | 1 = errores encontrados
 *
 * Valida recipes.json, posts.json y price_db.json
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Colores ANSI ─────────────────────────────────────────────
const RED    = '\x1b[31m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

function ok(msg)    { console.log(`${GREEN}  ✓ ${RESET}${msg}`); }
function err(msg)   { console.log(`${RED}  ✗ ${RESET}${msg}`); }
function header(msg){ console.log(`\n${BOLD}${msg}${RESET}`); }
function warn(msg)  { console.log(`${YELLOW}  ⚠ ${RESET}${msg}`); }

// ── Cargar JSON con manejo de errores ────────────────────────
function loadJson(file) {
  const path = resolve(ROOT, file);
  try {
    const raw = readFileSync(path, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return { _loadError: e.message };
  }
}

// ── Strip HTML ───────────────────────────────────────────────
function stripHtml(html) {
  return String(html || '').replace(/<[^>]+>/g, '').trim();
}

// ── Validar texto de paso de instrucción ─────────────────────
function getStepText(step) {
  if (typeof step === 'string') return step.trim();
  if (typeof step === 'object' && step !== null) {
    return (step.text || step.step || '').trim();
  }
  return '';
}

let totalErrors = 0;
let totalWarnings = 0;

// ══════════════════════════════════════════════════════════════
// BLOQUE [RECETAS]
// ══════════════════════════════════════════════════════════════
header('[RECETAS] — Validando recipes.json');

const recipes = loadJson('recipes.json');

if (recipes._loadError) {
  err(`No se pudo cargar recipes.json: ${recipes._loadError}`);
  totalErrors++;
} else if (!Array.isArray(recipes)) {
  err('recipes.json debe ser un array');
  totalErrors++;
} else {
  console.log(`  Cargados: ${recipes.length} registros`);
  const recetaSlugs = new Set();
  let recetaErrors = 0;
  let recetaWarnings = 0;

  recipes.forEach(function(r, idx) {
    const label = `#${idx + 1} "${r.title || r.slug || 'sin-nombre'}"`;
    const rowErrors = [];
    const rowWarns  = [];

    // slug
    if (!r.slug || !String(r.slug).trim()) {
      rowErrors.push('slug vacío o faltante');
    } else {
      if (recetaSlugs.has(r.slug)) {
        rowErrors.push(`slug duplicado: "${r.slug}"`);
      }
      recetaSlugs.add(r.slug);
    }

    // title
    if (!r.title || String(r.title).length < 10) {
      rowErrors.push(`title muy corto (${String(r.title || '').length} < 10 chars)`);
    }

    // description
    if (!r.description || String(r.description).length < 80) {
      rowErrors.push(`description muy corta (${String(r.description || '').length} < 80 chars)`);
    }

    // ingredients
    if (!Array.isArray(r.ingredients) || r.ingredients.length === 0) {
      rowErrors.push('ingredients vacío o faltante');
    }

    // instructions
    if (!Array.isArray(r.instructions) || r.instructions.length === 0) {
      rowErrors.push('instructions vacío o faltante');
    } else {
      r.instructions.forEach(function(step, si) {
        const text = getStepText(step);
        if (!text || text.length < 5) {
          rowErrors.push(`paso ${si + 1} sin texto válido`);
        }
      });
    }

    // image_url
    if (!r.image_url || !String(r.image_url).trim()) {
      rowErrors.push('image_url faltante');
    }

    // region
    if (!r.region || !String(r.region).trim()) {
      rowErrors.push('region faltante');
    }

    // Warnings opcionales
    if (!r.keywords || r.keywords.length === 0) {
      rowWarns.push('sin keywords (recomendado para SEO)');
    }
    if (!r.category) rowWarns.push('sin category');

    if (rowErrors.length > 0) {
      err(`${label}:`);
      rowErrors.forEach(function(e) { console.log(`      → ${e}`); });
      recetaErrors += rowErrors.length;
    }
    if (rowWarns.length > 0) {
      rowWarns.forEach(function(w) { warn(`${label}: ${w}`); });
      recetaWarnings += rowWarns.length;
    }
  });

  totalErrors    += recetaErrors;
  totalWarnings  += recetaWarnings;

  if (recetaErrors === 0) {
    ok(`${recipes.length} recetas válidas — 0 errores${recetaWarnings > 0 ? `, ${recetaWarnings} advertencias` : ''}`);
  } else {
    err(`${recetaErrors} error(es) en ${recipes.length} recetas`);
  }
}

// ══════════════════════════════════════════════════════════════
// BLOQUE [POSTS]
// ══════════════════════════════════════════════════════════════
header('[POSTS] — Validando posts.json');

const posts = loadJson('posts.json');

let postSlugs = new Set();

if (posts._loadError) {
  err(`No se pudo cargar posts.json: ${posts._loadError}`);
  totalErrors++;
} else if (!Array.isArray(posts)) {
  err('posts.json debe ser un array');
  totalErrors++;
} else {
  console.log(`  Cargados: ${posts.length} registros`);
  let postErrors = 0;
  let postWarnings = 0;

  posts.forEach(function(p, idx) {
    const label = `#${idx + 1} "${p.title || p.slug || 'sin-nombre'}"`;
    const rowErrors = [];
    const rowWarns  = [];

    // slug
    if (!p.slug || !String(p.slug).trim()) {
      rowErrors.push('slug vacío o faltante');
    } else {
      if (postSlugs.has(p.slug)) {
        rowErrors.push(`slug duplicado: "${p.slug}"`);
      }
      postSlugs.add(p.slug);
    }

    // title
    if (!p.title || String(p.title).length < 10) {
      rowErrors.push(`title muy corto (${String(p.title || '').length} < 10 chars)`);
    }

    // description
    if (!p.description || String(p.description).length < 80) {
      rowErrors.push(`description muy corta (${String(p.description || '').length} < 80 chars)`);
    }

    // content
    const contentText = stripHtml(p.content || '');
    if (!contentText || contentText.length < 20) {
      rowErrors.push(`content vacío o demasiado corto (${contentText.length} chars)`);
    }

    // image_url
    if (!p.image_url || !String(p.image_url).trim()) {
      rowErrors.push('image_url faltante');
    }

    // category
    if (!p.category || !String(p.category).trim()) {
      rowErrors.push('category faltante');
    }

    // Warnings
    if (!p.keywords || p.keywords.length === 0) {
      rowWarns.push('sin keywords');
    }
    if (!p.region) rowWarns.push('sin region');

    if (rowErrors.length > 0) {
      err(`${label}:`);
      rowErrors.forEach(function(e) { console.log(`      → ${e}`); });
      postErrors += rowErrors.length;
    }
    if (rowWarns.length > 0) {
      rowWarns.forEach(function(w) { warn(`${label}: ${w}`); });
      postWarnings += rowWarns.length;
    }
  });

  totalErrors   += postErrors;
  totalWarnings += postWarnings;

  if (postErrors === 0) {
    ok(`${posts.length} posts válidos — 0 errores${postWarnings > 0 ? `, ${postWarnings} advertencias` : ''}`);
  } else {
    err(`${postErrors} error(es) en ${posts.length} posts`);
  }
}

// ══════════════════════════════════════════════════════════════
// BLOQUE [GLOBAL] — slugs cruzados
// ══════════════════════════════════════════════════════════════
header('[GLOBAL] — Validando unicidad de slugs entre recetas y posts');

if (!recipes._loadError && !posts._loadError &&
    Array.isArray(recipes) && Array.isArray(posts)) {
  const allRecipeSlugs = new Set(recipes.map(function(r) { return r.slug; }).filter(Boolean));
  const allPostSlugs   = new Set(posts.map(function(p) { return p.slug; }).filter(Boolean));
  const crossDups = [];
  allRecipeSlugs.forEach(function(slug) {
    if (allPostSlugs.has(slug)) crossDups.push(slug);
  });
  if (crossDups.length > 0) {
    crossDups.forEach(function(slug) {
      err(`Slug "${slug}" existe tanto en recetas como en posts`);
    });
    totalErrors += crossDups.length;
  } else {
    ok('Sin duplicados entre recetas y posts');
  }
}

// ══════════════════════════════════════════════════════════════
// BLOQUE [PRICE_DB]
// ══════════════════════════════════════════════════════════════
header('[PRICE_DB] — Validando price_db.json');

const priceDb = loadJson('price_db.json');

if (priceDb._loadError) {
  err(`No se pudo cargar price_db.json: ${priceDb._loadError}`);
  totalErrors++;
} else if (typeof priceDb !== 'object' || Array.isArray(priceDb)) {
  err('price_db.json debe ser un objeto key-value');
  totalErrors++;
} else {
  const keys = Object.keys(priceDb);
  let priceErrors = 0;
  keys.forEach(function(key) {
    const entry = priceDb[key];
    if (typeof entry !== 'object') {
      err(`Entrada "${key}": no es un objeto`);
      priceErrors++;
      return;
    }
    if (typeof entry.reference_price_min !== 'number') {
      warn(`Entrada "${key}": reference_price_min no es número`);
      totalWarnings++;
    }
  });
  totalErrors += priceErrors;
  if (priceErrors === 0) {
    ok(`${keys.length} ingredientes — estructura válida`);
  }
}

// ══════════════════════════════════════════════════════════════
// RESUMEN FINAL
// ══════════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(55));
if (totalErrors === 0) {
  console.log(`${GREEN}${BOLD}  Quality Gate OK — 0 errores${totalWarnings > 0 ? `, ${totalWarnings} advertencias` : ''}${RESET}`);
  console.log('═'.repeat(55) + '\n');
  process.exit(0);
} else {
  console.log(`${RED}${BOLD}  Quality Gate FALLÓ — ${totalErrors} error(es)${totalWarnings > 0 ? `, ${totalWarnings} advertencia(s)` : ''}${RESET}`);
  console.log('═'.repeat(55) + '\n');
  process.exit(1);
}
