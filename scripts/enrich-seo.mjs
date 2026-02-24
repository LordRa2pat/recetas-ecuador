#!/usr/bin/env node
/**
 * enrich-seo.mjs — Auto-SEO idempotente
 * Ecuador a la Carta
 *
 * Uso:   node scripts/enrich-seo.mjs
 *
 * - Añade meta_title, meta_description, og_image si faltan.
 * - NUNCA sobreescribe campos que ya existen.
 * - Hace backup .bak antes de escribir.
 * - Idempotente: segunda ejecución → 0 cambios si ya está completo.
 */

import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Colores ANSI ─────────────────────────────────────────────
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';
const CYAN   = '\x1b[36m';

function log(msg)    { console.log(msg); }
function ok(msg)     { console.log(`${GREEN}  ✓ ${RESET}${msg}`); }
function changed(msg){ console.log(`${YELLOW}  + ${RESET}${msg}`); }
function header(msg) { console.log(`\n${BOLD}${CYAN}${msg}${RESET}`); }

// ── Truncar por palabras ──────────────────────────────────────
function truncateWords(text, maxLen) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  const words = clean.split(' ');
  let result = '';
  for (const word of words) {
    if ((result + ' ' + word).trim().length > maxLen - 3) break;
    result = (result + ' ' + word).trim();
  }
  return result + '...';
}

// ── Cargar JSON ───────────────────────────────────────────────
function loadJson(file) {
  const path = resolve(ROOT, file);
  const raw = readFileSync(path, 'utf-8');
  return JSON.parse(raw);
}

// ── Guardar JSON con backup ───────────────────────────────────
function saveJson(file, data) {
  const path = resolve(ROOT, file);
  const backupPath = path + '.bak';
  copyFileSync(path, backupPath);
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
  return backupPath;
}

// ── Enriquecer un registro ────────────────────────────────────
function enrichRecord(record, siteTag, changes) {
  let updated = 0;

  // meta_title → "{title} | {siteTag}" truncado a 60 chars
  if (!record.meta_title) {
    const base = String(record.title || '');
    const candidate = `${base} | ${siteTag}`;
    record.meta_title = candidate.length <= 60 ? candidate : truncateWords(base, 57 - siteTag.length) + ` | ${siteTag}`;
    changes.push(`meta_title: "${record.meta_title}"`);
    updated++;
  }

  // meta_description → description truncada a 155 chars
  if (!record.meta_description) {
    const desc = String(record.description || '');
    record.meta_description = truncateWords(desc, 155);
    changes.push(`meta_description: "${record.meta_description.slice(0, 60)}..."`);
    updated++;
  }

  // og_image → image_url
  if (!record.og_image && record.image_url) {
    record.og_image = record.image_url;
    changes.push(`og_image: (from image_url)`);
    updated++;
  }

  return updated;
}

// ══════════════════════════════════════════════════════════════
// RECETAS
// ══════════════════════════════════════════════════════════════
header('[RECETAS] — Enriqueciendo recipes.json');

const recipes = loadJson('recipes.json');
let recipesTotal = 0;
let recipesSkipped = 0;

recipes.forEach(function(r, idx) {
  const changes = [];
  const n = enrichRecord(r, 'Ecuador a la Carta', changes);
  if (n > 0) {
    changed(`#${idx + 1} "${r.title}": ${changes.length} campos añadidos`);
    recipesTotal += n;
  } else {
    recipesSkipped++;
  }
});

if (recipesTotal > 0) {
  const bak = saveJson('recipes.json', recipes);
  ok(`${recipesTotal} campos escritos en recipes.json (backup: ${bak.split(/[\\/]/).pop()})`);
} else {
  ok(`recipes.json ya estaba completo — 0 cambios (${recipesSkipped} registros omitidos)`);
}

// ══════════════════════════════════════════════════════════════
// POSTS
// ══════════════════════════════════════════════════════════════
header('[POSTS] — Enriqueciendo posts.json');

const posts = loadJson('posts.json');
let postsTotal = 0;
let postsSkipped = 0;

posts.forEach(function(p, idx) {
  const changes = [];
  const n = enrichRecord(p, 'Ecuador a la Carta', changes);
  if (n > 0) {
    changed(`#${idx + 1} "${p.title}": ${changes.length} campos añadidos`);
    postsTotal += n;
  } else {
    postsSkipped++;
  }
});

if (postsTotal > 0) {
  const bak = saveJson('posts.json', posts);
  ok(`${postsTotal} campos escritos en posts.json (backup: ${bak.split(/[\\/]/).pop()})`);
} else {
  ok(`posts.json ya estaba completo — 0 cambios (${postsSkipped} registros omitidos)`);
}

// ══════════════════════════════════════════════════════════════
// RESUMEN
// ══════════════════════════════════════════════════════════════
const grand = recipesTotal + postsTotal;
const grandSkipped = recipesSkipped + postsSkipped;

console.log('\n' + '═'.repeat(55));
if (grand > 0) {
  console.log(`${BOLD}  Enrich SEO completado: ${grand} campo(s) escrito(s), ${grandSkipped} registro(s) sin cambios${RESET}`);
} else {
  console.log(`${GREEN}${BOLD}  Enrich SEO idempotente: 0 cambios — todos los campos ya estaban completos${RESET}`);
}
console.log('═'.repeat(55) + '\n');
