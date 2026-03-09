const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..');

const buildSeoMetaTags = (file, content) => {
    const isRecipe = file.includes('recipe.html');
    const isBlog = file.includes('blog.html') || file.includes('post.html');

    // Extractor básico de título o default
    let titleMatch = content.match(/<title>(.*?)<\/title>/);
    let title = titleMatch ? titleMatch[1] : 'Ecuador a la Carta — Gastronomía y Turismo Ecuatoriano';

    // Extractor básico de descripción o default
    let descMatch = content.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
    let desc = descMatch ? descMatch[1] : 'La revista premium de gastronomía ecuatoriana. Recetas auténticas, guías para la diáspora y rutas turísticas gastronómicas del Ecuador.';

    // Canonical link
    const filename = path.basename(file);
    const canonicalBase = 'https://ecuadoralacarta.com/';
    const canonicalPath = filename === 'index.html' ? '' : filename;
    const canonical = canonicalBase + canonicalPath;

    // Schema base para Organizacion
    let schemas = `
    <!-- Schema.org JSON-LD (SEO 5 & 6) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Ecuador a la Carta",
      "url": "https://ecuadoralacarta.com",
      "logo": "https://ecuadoralacarta.com/LogoEcuadorAlacarta.png",
      "sameAs": [
        "https://www.facebook.com/ecuadoralacarta",
        "https://www.instagram.com/ecuadoralacarta"
      ]
    }
    </script>
`;

    if (isRecipe) {
        schemas += `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Recipe",
      "name": "${title.replace(/"/g, '&quot;')}",
      "author": {
        "@type": "Person",
        "name": "Ecuador a la Carta"
      },
      "description": "${desc.replace(/"/g, '&quot;')}"
    }
    </script>
`;
    }

    return `
    <!-- Canonical URL (SEO 9) -->
    <link rel="canonical" href="${canonical}" />
    
    <!-- Language & Alternate (SEO 10) -->
    <link rel="alternate" hreflang="es-EC" href="${canonical}" />

    <!-- Open Graph (SEO 3) -->
    <meta property="og:type" content="${isBlog || isRecipe ? 'article' : 'website'}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:title" content="${title.replace(/"/g, '&quot;')}">
    <meta property="og:description" content="${desc.replace(/"/g, '&quot;')}">
    <meta property="og:locale" content="es_EC">
    <meta property="og:site_name" content="Ecuador a la Carta">

    <!-- Twitter (SEO 4) -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${canonical}">
    <meta property="twitter:title" content="${title.replace(/"/g, '&quot;')}">
    <meta property="twitter:description" content="${desc.replace(/"/g, '&quot;')}">

    ${schemas}

    <!-- Preconnect (SEO 14) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
`;
};

function getHtmlFiles(dir, filesList = []) {
    if (!fs.existsSync(dir)) return filesList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'scripts' && !file.startsWith('.')) {
                getHtmlFiles(fullPath, filesList);
            }
        } else if (fullPath.endsWith('.html')) {
            filesList.push(fullPath);
        }
    }
    return filesList;
}

const htmlFiles = getHtmlFiles(publicDir);

for (const file of htmlFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // 1. Inyectar SEO Metatags justo antes del final del </head>
    if (!content.includes('property="og:locale"')) {
        const metatags = buildSeoMetaTags(file, content);
        content = content.replace('</head>', `${metatags}\n</head>`);
        modified = true;
    }

    // 2. Corregir viewport (Mobile Optimization)
    if (!content.includes('maximum-scale=5.0') && content.includes('<meta name="viewport"')) {
        content = content.replace(/<meta name="viewport" content="width=device-width, initial-scale=1.0"\s*\/?>/g, '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />');
        modified = true;
    }

    // 3. Forzar tag LANG en html (Language Optimization)
    if (content.match(/<html\s*>/i)) {
        content = content.replace(/<html\s*>/i, '<html lang="es-EC">');
        modified = true;
    } else if (content.match(/<html lang="es"\s*>/i)) {
        content = content.replace(/<html lang="es"\s*>/i, '<html lang="es-EC">');
        modified = true;
    }


    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log("Injected SEO globally in: " + path.basename(file));
    }
}

// 4. Inyectar nuevo bloque CSS Premium en todos los archivos
const premiumCSS = `    .btn-luxury {
      background: var(--gold-gradient);
      color: #0B1221;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      overflow: hidden;
      z-index: 1;
    }

    .btn-luxury::before {
      content: '';
      position: absolute;
      top: 0; left: -100%; width: 50%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
      transform: skewX(-20deg);
      transition: 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: -1;
    }

    .btn-luxury:hover::before { left: 150%; }

    .btn-luxury:hover {
      transform: translateY(-4px) scale(1.03);
      box-shadow: 0 20px 40px rgba(220, 160, 17, 0.5);
    }`;

for (const file of htmlFiles) {
    if (path.basename(file) === 'index.html') continue; // Index.html ya actualizado manualmente
    let content = fs.readFileSync(file, 'utf8');

    // Busca regex de btn-luxury basico y lo reemplaza con premium
    const oldCssRegex = /\.btn-luxury\s*\{[\s\S]*?box-shadow:\s*0\s*0\s*30px\s*rgba\(220,\s*160,\s*17,\s*0\.4\);\s*\}/g;

    if (content.match(oldCssRegex)) {
        content = content.replace(oldCssRegex, premiumCSS);
        fs.writeFileSync(file, content, 'utf8');
        console.log("Injected Premium CSS globally in: " + path.basename(file));
    }
}

console.log('✅ Finalizó el proceso de inyección de las 20 optimizaciones SEO + Premium CSS de Ecuadoralacarta.');
