#!/usr/bin/env node
/**
 * smoke-test.mjs — Smoke Test de Producción
 * Ecuador a la Carta — ecuadoralacarta.com
 *
 * Uso:   node scripts/smoke-test.mjs
 * Exit:  0 = todo OK | 1 = alguna falla
 *
 * Verifica HTTP 200, JSON válido, y elementos HTML esperados.
 */

// ── Colores ANSI ──────────────────────────────────────────────
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

function pass(msg)   { console.log(`${GREEN}  ✓ ${RESET}${msg}`); }
function fail(msg)   { console.log(`${RED}  ✗ ${RESET}${msg}`); }
function info(msg)   { console.log(`${CYAN}  → ${RESET}${msg}`); }
function header(msg) { console.log(`\n${BOLD}${msg}${RESET}`); }

const BASE = 'https://ecuadoralacarta.com';

const TESTS = [
  {
    url: `${BASE}/`,
    type: 'html',
    checks: [
      { desc: 'contiene <title>',          pattern: /<title>/i },
      { desc: 'contiene Ecuador',           pattern: /Ecuador/i },
      { desc: 'contiene grid de recetas',  pattern: /id=["']?classic-grid["']?/i },
    ]
  },
  {
    url: `${BASE}/recipes.json`,
    type: 'json',
    checks: [
      { desc: 'es array',                  fn: (d) => Array.isArray(d) },
      { desc: 'tiene al menos 1 receta',   fn: (d) => d.length >= 1 },
      { desc: 'primera receta tiene slug', fn: (d) => typeof d[0]?.slug === 'string' && d[0].slug.length > 0 },
      { desc: 'primera receta tiene title',fn: (d) => typeof d[0]?.title === 'string' && d[0].title.length > 0 },
    ]
  },
  {
    url: `${BASE}/posts.json`,
    type: 'json',
    checks: [
      { desc: 'es array',                  fn: (d) => Array.isArray(d) },
      { desc: 'tiene al menos 1 post',     fn: (d) => d.length >= 1 },
      { desc: 'primer post tiene slug',    fn: (d) => typeof d[0]?.slug === 'string' && d[0].slug.length > 0 },
    ]
  },
  {
    url: `${BASE}/recipes.html`,
    type: 'html',
    checks: [
      { desc: 'contiene <title>',          pattern: /<title>/i },
      { desc: 'contiene Recetas',          pattern: /Recetas/i },
    ]
  },
  {
    url: `${BASE}/blog.html`,
    type: 'html',
    checks: [
      { desc: 'contiene <title>',          pattern: /<title>/i },
      { desc: 'contiene Blog o Turismo',   pattern: /Blog|Turismo/i },
    ]
  },
];

let totalFails = 0;

async function runTest(testDef) {
  const { url, type, checks } = testDef;
  header(`▸ ${url}`);
  info(`Tipo: ${type}`);

  let res;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': 'smoke-test-ecuadoralacarta/1.0' },
      signal: AbortSignal.timeout(10000),
    });
  } catch (e) {
    fail(`Error de red: ${e.message}`);
    totalFails++;
    return;
  }

  if (res.status === 200) {
    pass(`HTTP ${res.status} OK`);
  } else {
    fail(`HTTP ${res.status} (esperado 200)`);
    totalFails++;
    return;
  }

  let body;
  let parsedJson;
  try {
    body = await res.text();
    if (type === 'json') {
      parsedJson = JSON.parse(body);
      pass(`JSON válido (${body.length} bytes)`);
    } else {
      pass(`HTML recibido (${body.length} bytes)`);
    }
  } catch (e) {
    fail(`Error al parsear respuesta: ${e.message}`);
    totalFails++;
    return;
  }

  for (const check of checks) {
    if (check.pattern) {
      if (check.pattern.test(body)) {
        pass(check.desc);
      } else {
        fail(`${check.desc} — patrón no encontrado: ${check.pattern}`);
        totalFails++;
      }
    } else if (check.fn) {
      try {
        if (check.fn(parsedJson)) {
          pass(check.desc);
        } else {
          fail(`${check.desc} — aserción falsa`);
          totalFails++;
        }
      } catch (e) {
        fail(`${check.desc} — excepción: ${e.message}`);
        totalFails++;
      }
    }
  }
}

// ── Main ──────────────────────────────────────────────────────
console.log(`\n${BOLD}${CYAN}${'═'.repeat(58)}${RESET}`);
console.log(`${BOLD}${CYAN}  Smoke Test — ecuadoralacarta.com${RESET}`);
console.log(`${BOLD}${CYAN}${'═'.repeat(58)}${RESET}`);

for (const test of TESTS) {
  await runTest(test);
}

console.log(`\n${'═'.repeat(58)}`);
if (totalFails === 0) {
  console.log(`${GREEN}${BOLD}  ✓ Smoke Test OK — todas las URLs responden correctamente${RESET}`);
  console.log(`${'═'.repeat(58)}\n`);
  process.exit(0);
} else {
  console.log(`${RED}${BOLD}  ✗ Smoke Test FALLÓ — ${totalFails} falla(s) detectada(s)${RESET}`);
  console.log(`${'═'.repeat(58)}\n`);
  process.exit(1);
}
