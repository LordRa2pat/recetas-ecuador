#!/usr/bin/env node
/**
 * fix-recipe-images-wiki.mjs
 * 
 * Busca imágenes de ARTÍCULOS de Wikipedia (no Commons) para cada receta.
 * Los artículos de Wikipedia sobre comida casi siempre tienen fotos reales del plato.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const recipesPath = resolve('recipes.json');

// Mapeo manual: slug → título del artículo de Wikipedia (es/en)
const wikiArticles = {
    'caldo-de-pata': ['Caldo_de_pata', 'es'],
    'seco-de-gallina': ['Seco_de_pollo', 'es'],
    'seco-de-pato-lojano': ['Seco_(plato)', 'es'],
    'bollo-de-yuca-ecuatoriano': ['Bollo_(gastronomía)', 'es'],
    'carne-colorada-ecuatoriana-receta': ['Carne_colorada', 'es'],
    'seco-de-conejo-amazonia-ecuatoriana': ['Seco_(plato)', 'es'],
    'tapado-ecuatoriano-esmeraldas-coco-mariscos-selvaticos': ['Tapado_(dish)', 'en'],
    'bolon-de-verde-con-chorizo-regional': ['Bolón_de_verde', 'es'],
    'humitas-ecuatorianas-costa-norte': ['Humita', 'es'],
    'mote-pillo-sierra-central-ecuador': ['Mote_pillo', 'es'],
    'fritada-ecuatoriana-sierra-oriental': ['Fritada', 'es'],
    'fanesca-de-la-costa-ecuatoriana-receta': ['Fanesca', 'es'],
    'hornado-quiteno-receta-tradicional': ['Hornado', 'es'],
    'caldo-de-mondongo-ecuatoriano': ['Mondongo_(gastronomía)', 'es'],
};

async function getWikiImage(title, lang) {
    const url = `https://${lang}.wikipedia.org/w/api.php?` + new URLSearchParams({
        action: 'query',
        prop: 'pageimages',
        pithumbsize: '800',
        titles: title,
        format: 'json',
        origin: '*',
    });

    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'EcuadorAlaCarta/1.0' },
            signal: AbortSignal.timeout(10000),
        });
        const data = await res.json();
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];

        if (page.thumbnail) {
            return {
                image_url: page.thumbnail.source,
                image_credit: {
                    source: `Wikipedia (${lang})`,
                    author: '',
                    license: 'CC BY-SA',
                    url: `https://${lang}.wikipedia.org/wiki/${title}`,
                },
                _image_source: 'wikipedia',
                _image_source_url: `https://${lang}.wikipedia.org/wiki/${title}`,
            };
        }
        return null;
    } catch (e) {
        console.error(`  Error fetching ${title}:`, e.message);
        return null;
    }
}

async function main() {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  Fix Recipe Images — Wikipedia Articles');
    console.log('═══════════════════════════════════════════════════════\n');

    const recipes = JSON.parse(readFileSync(recipesPath, 'utf8'));
    let updated = 0;

    for (const recipe of recipes) {
        const mapping = wikiArticles[recipe.slug];
        if (!mapping) continue;

        const [title, lang] = mapping;
        process.stdout.write(`  🔍 ${recipe.slug.padEnd(55)} `);

        const result = await getWikiImage(title, lang);

        if (result) {
            recipe.image_url = result.image_url;
            recipe.image_credit = result.image_credit;
            recipe._image_source = result._image_source;
            recipe._image_source_url = result._image_source_url;
            updated++;
            console.log(`✅ ${result.image_url.substring(0, 60)}...`);
        } else {
            console.log('❌ No image found');
        }

        await new Promise(r => setTimeout(r, 300));
    }

    console.log(`\n──────────────────────────────────────────────────────`);
    console.log(`  Actualizadas: ${updated}`);

    if (updated > 0) {
        writeFileSync(recipesPath, JSON.stringify(recipes, null, 2), 'utf8');
        console.log('  ✅ recipes.json guardado');
    }

    console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(e => { console.error(e); process.exit(1); });
