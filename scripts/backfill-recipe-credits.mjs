#!/usr/bin/env node
/**
 * backfill-recipe-credits.mjs
 * Ecuador a la Carta
 *
 * Agrega image_credit a recetas que tienen imagen pero no crédito.
 * Uso: node scripts/backfill-recipe-credits.mjs [--dry-run]
 *
 * Lógica:
 *  - Si image_url es de upload.wikimedia.org → marca como wikimedia_commons
 *  - Si image_url es de raw.githubusercontent.com → marca como github_raw (no requiere crédito)
 *  - Si image_url es de images.unsplash.com → marca como web_search con fuente unsplash.com
 *  - Otros → marca como web_search con el hostname como fuente
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

const DRY_RUN = process.argv.includes('--dry-run');
const recipesPath = resolve('recipes.json');

function buildCredit(imageUrl) {
    if (!imageUrl) return null;

    try {
        const url = new URL(imageUrl);
        const host = url.hostname;

        if (host.includes('wikimedia.org') || host.includes('wikipedia.org')) {
            return {
                image_credit: {
                    source: 'Wikimedia Commons',
                    author: '',
                    license: 'CC BY-SA',
                    url: imageUrl,
                },
                _image_source: 'wikimedia_commons',
                _image_source_url: imageUrl,
            };
        }

        if (host.includes('githubusercontent.com')) {
            return {
                image_credit: {
                    source: 'GitHub (propia)',
                    author: 'Ecuador a la Carta',
                    license: '',
                    url: '',
                },
                _image_source: 'github_raw',
                _image_source_url: '',
            };
        }

        if (host.includes('unsplash.com')) {
            return {
                image_credit: {
                    source: 'Unsplash',
                    author: '',
                    license: 'Unsplash License',
                    url: imageUrl,
                },
                _image_source: 'web_search',
                _image_source_url: imageUrl,
            };
        }

        // Any other source
        return {
            image_credit: {
                source: host,
                author: '',
                license: '',
                url: imageUrl,
            },
            _image_source: 'web_search',
            _image_source_url: imageUrl,
        };
    } catch {
        return null;
    }
}

// ── Main ──
function main() {
    console.log(`\n${BOLD}${CYAN}${'═'.repeat(58)}${RESET}`);
    console.log(`${BOLD}${CYAN}  Backfill Recipe Credits${RESET}`);
    console.log(`${BOLD}${CYAN}${'═'.repeat(58)}${RESET}`);
    if (DRY_RUN) console.log(`${YELLOW}  ⚠ Modo DRY RUN — no se guardarán cambios${RESET}\n`);

    const recipes = JSON.parse(readFileSync(recipesPath, 'utf8'));
    const noCredit = recipes.filter(r => r.image_url && !r.image_credit);

    console.log(`  Total recetas: ${recipes.length}`);
    console.log(`  Con imagen pero sin crédito: ${noCredit.length}\n`);

    let updated = 0;

    for (const recipe of noCredit) {
        const credit = buildCredit(recipe.image_url);
        if (credit) {
            recipe.image_credit = credit.image_credit;
            recipe._image_source = credit._image_source;
            recipe._image_source_url = credit._image_source_url;
            updated++;
            console.log(`  ${GREEN}✓${RESET} ${recipe.slug} → ${credit._image_source}`);
        } else {
            console.log(`  ${YELLOW}⚠${RESET} ${recipe.slug} → no se pudo determinar fuente`);
        }
    }

    console.log(`\n${'─'.repeat(58)}`);
    console.log(`  ${GREEN}Actualizadas: ${updated}${RESET}`);

    if (!DRY_RUN && updated > 0) {
        writeFileSync(recipesPath, JSON.stringify(recipes, null, 2), 'utf8');
        console.log(`\n  ${GREEN}✓ recipes.json actualizado${RESET}`);
    } else if (DRY_RUN) {
        console.log(`\n  ${YELLOW}⚠ DRY RUN — recipes.json NO fue modificado${RESET}`);
    }

    console.log(`${'═'.repeat(58)}\n`);
}

main();
