const fs = require('fs');
const files = ['script.js', 'mapa.svg', 'index.html', 'recipe.html', 'recipes.html', 'js/render.js', 'js/seo.js', 'js/utils.js', 'js/i18n.js'];

files.forEach(file => {
    try {
        const buffer = fs.readFileSync(file);
        let content;
        if (buffer[0] === 0xff && buffer[1] === 0xfe) {
            content = buffer.toString('utf16le');
        } else {
            content = buffer.toString('utf8');
        }
        // Remove BOM if present
        content = content.replace(/^\uFEFF/, '');
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed ${file}`);
    } catch (e) {
        console.error(`Error fixing ${file}: ${e.message}`);
    }
});
