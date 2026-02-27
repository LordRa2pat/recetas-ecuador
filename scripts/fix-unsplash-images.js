const fs = require('fs');
const path = require('path');

const RECIPES_FILE = path.join(__dirname, '../recipes.json');
const POSTS_FILE = path.join(__dirname, '../posts.json');

function fixImages(filePath, defaultImg) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    let data;
    try {
        data = JSON.parse(content);
    } catch (e) { return; }

    let changed = false;
    data.forEach((item) => {
        if (item.image_url && item.image_url.includes('unsplash.com')) {
            item.image_url = defaultImg;
            changed = true;
        }
        if (item.og_image && item.og_image.includes('unsplash.com')) {
            item.og_image = defaultImg;
            changed = true;
        }
        if (item._image_source_url && item._image_source_url.includes('unsplash.com')) {
            item._image_source_url = defaultImg;
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`Fixed images in ${filePath}`);
    }
}

fixImages(RECIPES_FILE, 'images/default-recipe.jpg');
fixImages(POSTS_FILE, 'images/default-turismo.jpg');
