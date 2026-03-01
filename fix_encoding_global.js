const fs = require('fs');
const files = [
    'script.js', 'mapa.svg', 'index.html', 'recipe.html', 'recipes.html', 'menu-semanal.html', 'blog.html', 'post.html',
    'js/render.js', 'js/seo.js', 'js/utils.js', 'js/i18n.js', 'js/ads.js', 'js/i18n.js',
    'recipes.json', 'posts.json', 'glossary.json', 'price_db.json', 'i18n/es.json', 'i18n/en.json'
];

files.forEach(file => {
    try {
        if (!fs.existsSync(file)) return;
        const buffer = fs.readFileSync(file);
        let content;
        // Check for UTF-16LE BOM
        if (buffer[0] === 0xff && buffer[1] === 0xfe) {
            content = buffer.toString('utf16le');
        } else if (buffer[0] === 0xfe && buffer[1] === 0xff) {
            content = buffer.toString('utf16be');
        } else {
            content = buffer.toString('utf8');
        }
        // Remove BOM (UTF-8 or others)
        content = content.replace(/^\uFEFF/, '');
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed ${file}`);
    } catch (e) {
        console.error(`Error fixing ${file}: ${e.message}`);
    }
});
