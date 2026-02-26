#!/usr/bin/env node
/**
 * backfill-post-images.mjs
 * Ecuador a la Carta
 *
 * Busca imágenes en Wikimedia Commons para posts sin imagen.
 * Usa múltiples queries de búsqueda con fallback progresivo.
 *
 * Uso: node scripts/backfill-post-images.mjs [--dry-run]
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
const postsPath = resolve('posts.json');

// ── Generar múltiples queries de búsqueda ──
function generateSearchQueries(title) {
    const queries = [];

    // 1. Limpiar título base
    const clean = title
        .replace(/\d{4}[-–]\d{4}/g, '')
        .replace(/\d{4}/g, '')
        .replace(/guía\s+(completa\s+)?(de\s+)?/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    // 2. Extraer nombre del destino (primera parte antes de ":")
    const destino = clean.split(':')[0].trim();

    // 3. Extraer palabras clave del tema (después de ":")
    const tema = clean.split(':').slice(1).join(':').trim();

    // 4. Extraer solo el nombre del lugar (quitar descriptores comunes)
    const lugarClean = destino
        .replace(/parque\s+nacional\s*/gi, '')
        .replace(/reserva\s*/gi, '')
        .replace(/fiesta\s+(de\s+la\s+|del?\s+)/gi, '')
        .replace(/carnaval\s+de\s*/gi, 'Carnaval ')
        .replace(/ruta\s+del?\s*/gi, '')
        .replace(/volcán\s*/gi, '')
        .replace(/valle\s+de\s*/gi, '')
        .replace(/laguna\s+de\s*/gi, 'Laguna ')
        .replace(/islas?\s*/gi, '')
        .replace(/bosque\s+petrificado\s+de\s*/gi, '')
        .trim();

    // Query 1: Destino + Ecuador
    queries.push(`${destino} Ecuador`);

    // Query 2: Lugar limpio + Ecuador
    if (lugarClean !== destino) {
        queries.push(`${lugarClean} Ecuador`);
    }

    // Query 3: Si hay tema, destino + tema relevante
    if (tema) {
        const temaCorto = tema.split(/[,y]/)[0].trim();
        queries.push(`${destino} ${temaCorto}`);
    }

    // Query 4: Solo nombre simple del lugar
    queries.push(lugarClean);

    // Query 5: Para parques nacionales
    if (/parque\s+nacional/i.test(destino)) {
        queries.push(destino);
    }

    // Query 6: Para fiestas/carnavales
    if (/fiesta|carnaval|festival|yamor|mama negra|virgen/i.test(title)) {
        const fiestaMatch = title.match(/(fiesta\s+\w+\s+\w+\s*\w*|carnaval\s+de\s+\w+|mama\s+negra|yamor|virgen\s+\w+\s+\w+)/i);
        if (fiestaMatch) queries.push(`${fiestaMatch[0]} Ecuador`);
    }

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
    console.log(`${BOLD}${CYAN}  Backfill Post Images — Wikimedia (Multi-Query)${RESET}`);
    console.log(`${BOLD}${CYAN}${'═'.repeat(58)}${RESET}`);
    if (DRY_RUN) console.log(`${YELLOW}  ⚠ Modo DRY RUN — no se guardarán cambios${RESET}\n`);

    const posts = JSON.parse(readFileSync(postsPath, 'utf8'));
    const noImage = posts.filter(p => !p.image_url);

    console.log(`  Total posts: ${posts.length}`);
    console.log(`  Sin imagen: ${noImage.length}\n`);

    let found = 0;
    let failed = 0;

    for (const post of noImage) {
        const shortSlug = post.slug.substring(0, 52).padEnd(52);
        process.stdout.write(`  🔍 ${shortSlug} `);

        const result = await searchWithFallback(post.title);

        if (result) {
            post.image_url = result.image_url;
            post.image_credit = result.image_credit;
            post._image_source = result._image_source;
            post._image_source_url = result._image_source_url;
            post._imagen_status = result._imagen_status;
            found++;
            console.log(`${GREEN}✓ Encontrada${RESET}`);
        } else {
            post._imagen_status = 'pending_web_search';
            post._image_source = 'pending_web_search';
            failed++;
            console.log(`${YELLOW}⚠ No encontrada${RESET}`);
        }
    }

    console.log(`\n${'─'.repeat(58)}`);
    console.log(`  ${GREEN}Encontradas: ${found}${RESET}`);
    console.log(`  ${YELLOW}Pendientes: ${failed}${RESET}`);

    if (!DRY_RUN && found > 0) {
        writeFileSync(postsPath, JSON.stringify(posts, null, 2), 'utf8');
        console.log(`\n  ${GREEN}✓ posts.json actualizado${RESET}`);
    } else if (DRY_RUN) {
        console.log(`\n  ${YELLOW}⚠ DRY RUN — posts.json NO fue modificado${RESET}`);
    }

    console.log(`${'═'.repeat(58)}\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
