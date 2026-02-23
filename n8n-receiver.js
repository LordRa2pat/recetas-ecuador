#!/usr/bin/env node
'use strict';

/**
 * n8n-receiver.js
 * ───────────────
 * CLI bridge para insertar recetas en recipes.json (uso local/testing).
 *
 * Uso:
 *   node n8n-receiver.js '<json_string>'
 *   node n8n-receiver.js "$(cat test-recipe.json)"
 *
 * Acepta el JSON completo de la receta como primer argumento CLI.
 * Lee recipes.json, asigna ID auto-incremental, agrega al inicio
 * (más reciente primero) y escribe atómicamente (previene corrupción).
 *
 * stdout: JSON con { status, id, slug } — leer con "JSON Parse" en n8n.
 * En error: escribe en stderr y sale con código 1.
 *
 * NOTA: En producción el workflow n8n usa GitHub API directamente.
 * Este script es solo para desarrollo local y testing de recetas.
 *
 * CAMPOS OPCIONALES v3.0 (multi-nicho + enriquecimiento):
 *   "target_audience":           "Local" | "Diáspora" | "Turista"
 *   "international_substitutes": [ { original, sustituto_usa, sustituto_europa } ]
 *   "tourism_route":             "Descripción de la ruta gastronómica"
 *   "origin_cities":             [ { city, province, region } ]
 *   "places":                    [ { name, city, region, place_id, lat, lng, googleMapsUri, rating, userRatingCount, address } ]
 *   "youtube_videos":            [ { title, videoId, channel, url, embed, uploadDate } ]
 *   "image_credit":              { source, author, license, url }
 *   "image_alt":                 "Alt text descriptivo para SEO y accesibilidad"
 * El script guarda todos los campos recibidos sin modificarlos.
 */

const fs   = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────
const RECIPES_FILE = path.join(__dirname, 'recipes.json');

// ─── Helpers ──────────────────────────────────────────────────────────────────
function log(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

function fail(message, detail) {
  process.stderr.write(JSON.stringify({ error: message, detail: String(detail || '') }) + '\n');
  process.exit(1);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {

  // 1 ── Validate CLI argument
  const rawInput = process.argv[2];

  if (!rawInput || rawInput.trim() === '') {
    fail(
      'No JSON argument provided.',
      "Usage: node n8n-receiver.js '{\"title\":\"...\",\"slug\":\"...\"}'"
    );
  }

  // 2 ── Parse the incoming recipe JSON
  let newRecipe;
  try {
    newRecipe = JSON.parse(rawInput);
  } catch (parseErr) {
    fail(
      'Invalid JSON string provided as argument.',
      `Parse error: ${parseErr.message}\nInput (first 300 chars): ${rawInput.slice(0, 300)}`
    );
  }

  if (typeof newRecipe !== 'object' || Array.isArray(newRecipe) || newRecipe === null) {
    fail('JSON argument must be a single recipe object, not an array or primitive.');
  }

  // 3 ── Validate required fields
  const REQUIRED = ['title', 'slug'];
  for (const field of REQUIRED) {
    if (!newRecipe[field] || typeof newRecipe[field] !== 'string' || !newRecipe[field].trim()) {
      fail(`Missing or empty required field: "${field}"`, JSON.stringify(newRecipe));
    }
  }

  // Normalize slug: lowercase, only alphanumerics and hyphens
  newRecipe.slug = newRecipe.slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // 4 ── Read existing recipes.json
  let recipes = [];

  if (fs.existsSync(RECIPES_FILE)) {
    let raw;
    try {
      raw = fs.readFileSync(RECIPES_FILE, 'utf8');
    } catch (readErr) {
      fail('Cannot read recipes.json', readErr.message);
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        recipes = parsed;
      } else {
        process.stderr.write('WARN: recipes.json was not an array — resetting to [].\n');
        recipes = [];
      }
    } catch (jsonErr) {
      process.stderr.write(`WARN: recipes.json contained invalid JSON (${jsonErr.message}) — resetting to [].\n`);
      recipes = [];
    }
  } else {
    process.stderr.write(`WARN: recipes.json not found at "${RECIPES_FILE}" — will create it.\n`);
  }

  // 5 ── Check for duplicate slug
  const duplicate = recipes.find(r => r.slug === newRecipe.slug);
  if (duplicate) {
    log({
      status: 'skipped',
      reason: 'duplicate_slug',
      slug: newRecipe.slug,
      existing_id: duplicate.id,
      total_recipes: recipes.length,
    });
    process.exit(0);
  }

  // 6 ── Assign auto-incremented ID and timestamp
  const maxId = recipes.reduce((max, r) => {
    const id = Number(r.id) || 0;
    return id > max ? id : max;
  }, 0);

  newRecipe.id         = maxId + 1;
  newRecipe.created_at = new Date().toISOString();

  // 7 ── Prepend (newest first)
  recipes.unshift(newRecipe);

  // 8 ── Write back atomically (temp file → rename)
  const tmpFile = RECIPES_FILE + '.tmp';
  const content = JSON.stringify(recipes, null, 2);

  try {
    fs.writeFileSync(tmpFile, content, 'utf8');
    fs.renameSync(tmpFile, RECIPES_FILE);
  } catch (writeErr) {
    // On Windows, renameSync can fail if the target is locked.
    // Fall back to a direct write.
    try {
      if (fs.existsSync(tmpFile)) {
        try { fs.unlinkSync(tmpFile); } catch (_) { /* ignore */ }
      }
      fs.writeFileSync(RECIPES_FILE, content, 'utf8');
    } catch (fallbackErr) {
      fail('Cannot write recipes.json', fallbackErr.message);
    }
  }

  // 9 ── Report success to n8n via stdout
  log({
    status: 'success',
    id: newRecipe.id,
    slug: newRecipe.slug,
    title: newRecipe.title,
    total_recipes: recipes.length,
    created_at: newRecipe.created_at,
    recipes_file: RECIPES_FILE,
  });
}

main();
