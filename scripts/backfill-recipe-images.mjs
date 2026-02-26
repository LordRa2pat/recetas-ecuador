#!/usr/bin/env node
/**
 * backfill-recipe-images.mjs
 * Ecuador a la Carta
 *
 * Busca imágenes en Wikimedia Commons para recetas sin imagen.
 * Usa múltiples queries de búsqueda con fallback progresivo.
 *
 * Uso: node scripts/backfill-recipe-images.mjs [--dry-run]
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

const DRY_RUN = process.argv.includes('--dry-run');
const recipesPath = resolve('recipes.json');

// ── Generar múltiples queries de búsqueda ──
function generateSearchQueries(title) {
    const queries = [];

    // 1. Limpiar título base
    const clean = title
        .replace(/ecuatoriano|ecuatoriana|receta|tradicional|paso a paso/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    // 2. Extraer nombre de la receta (primera parte antes de ":")
    const recetaName = clean.split(':')[0].trim();

    // Query 1: Nombre + Ecuador
    queries.push(`${recetaName} Ecuador`);

    // Query 2: Solo nombre simple
    queries.push(recetaName);

    return [...new Set(queries)];
}

// ── Wikimedia Commons API ──
async function wikimediaSearch(searchTerms) {
    const url = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
        action: 'query',
        generator: 'search',
        gsrsearch: `File: ${searchTerms}`,
        gsrlimit: '5',
        gsrnamespace: '6',
        prop: 'imageinfo',
        iiprop: 'url|extmetadata|mime',
        iiurlwidth: '800',
        format: 'json',
        origin: '*',
    });

    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'EcuadorAlaCarta-Backfill/1.0 (contact@ecuadoralacarta.com)' },
            signal: AbortSignal.timeout(10000),
        });
        const data = await res.json();
        if (!data.query || !data.query.pages) return null;

        const pages = Object.values(data.query.pages);
        for (const page of pages) {
            const info = page.imageinfo?.[0];
            if (!info) continue;
            if (!info.mime || !info.mime.startsWith('image/')) continue;
            if (info.mime === 'image/svg+xml') continue;

            const thumburl = info.thumburl || info.url;
            if (!thumburl || thumburl.length < 30) continue;

            const meta = info.extmetadata || {};
            const author = meta.Artist?.value?.replace(/<[^>]*>/g, '').trim() || '';
            const license = meta.LicenseShortName?.value || 'CC BY-SA';
            const descUrl = meta.DescriptionUrl?.value || info.descriptionurl || '';

            return {
                image_url: thumburl,
                image_credit: {
                    source: 'Wikimedia Commons',
                    author: author,
                    license: license,
                    url: descUrl || `https://commons.wikimedia.org/wiki/${page.title}`,
                },
                _image_source: 'wikimedia_commons',
                _image_source_url: descUrl || `https://commons.wikimedia.org/wiki/${page.title}`,
                _imagen_status: 'ok',
            };
        }
        return null;
    } catch (e) {
        return null;
    }
}

async function searchWithFallback(title) {
    const queries = generateSearchQueries(title);
    for (const query of queries) {
        await new Promise(r => setTimeout(r, 500));
        const result = await wikimediaSearch(query);
        if (result) return result;
    }
    return null;
}

// ── Main ──
async function main() {
    console.log(`\n${BOLD}${CYAN}${'═'.repeat(58)}${RESET}`);
    console.log(`${BOLD}${CYAN}  Backfill Recipe Images — Wikimedia (Multi-Query)${RESET}`);
    console.log(`${BOLD}${CYAN}${'═'.repeat(58)}${RESET}`);
    if (DRY_RUN) console.log(`${YELLOW}  ⚠ Modo DRY RUN — no se guardarán cambios${RESET}\n`);

    const recipes = JSON.parse(readFileSync(recipesPath, 'utf8'));

    console.log(`  Total recetas: ${recipes.length}\n`);

    let found = 0;
    let failed = 0;

    for (const recipe of recipes) {
        const shortSlug = recipe.slug.substring(0, 52).padEnd(52);
        process.stdout.write(`  🔍 ${shortSlug} `);

        // Skip if already wikimedia
        if (recipe._image_source === 'wikimedia_commons' && recipe.image_url) {
            console.log(`${GREEN}✓ Ya es Wikimedia${RESET}`);
            continue;
        }

        const result = await searchWithFallback(recipe.title);

        if (result) {
            recipe.image_url = result.image_url;
            recipe.image_credit = result.image_credit;
            recipe._image_source = result._image_source;
            recipe._image_source_url = result._image_source_url;
            recipe._imagen_status = result._imagen_status;
            found++;
            console.log(`${GREEN}✓ Actualizada a Wikimedia${RESET}`);
        } else {
            // Keep existing image if search fails
            if (!recipe.image_url) {
                recipe._imagen_status = 'pending_web_search';
                recipe._image_source = 'pending_web_search';
            }
            failed++;
            console.log(`${YELLOW}⚠ No encontrada (mantiene actual)${RESET}`);
        }
    }

    console.log(`\n${'─'.repeat(58)}`);
    console.log(`  ${GREEN}Encontradas: ${found}${RESET}`);
    console.log(`  ${YELLOW}Pendientes: ${failed}${RESET}`);

    if (!DRY_RUN && found > 0) {
        writeFileSync(recipesPath, JSON.stringify(recipes, null, 2), 'utf8');
        console.log(`\n  ${GREEN}✓ recipes.json actualizado${RESET}`);
    } else if (DRY_RUN) {
        console.log(`\n  ${YELLOW}⚠ DRY RUN — recipes.json NO fue modificado${RESET}`);
    }

    console.log(`${'═'.repeat(58)}\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
