const fs = require('fs');
const path = require('path');

const RECIPES_FILE = path.join(__dirname, '../recipes.json');

function fixRecipeThumbnails() {
    if (!fs.existsSync(RECIPES_FILE)) return;
    const content = fs.readFileSync(RECIPES_FILE, 'utf8');
    let recipes;
    try {
        recipes = JSON.parse(content);
    } catch (e) { return; }

    let changed = false;
    recipes.forEach((recipe) => {
        // Check if the recipe has the default generic fallback image
        if (!recipe.image_url || recipe.image_url.includes('default-recipe.jpg') || recipe.image_url.includes('unsplash.com')) {
            if (recipe.youtube_videos && recipe.youtube_videos.length > 0) {
                // Find the first video not from KWA channel
                const validVideos = recipe.youtube_videos.filter(v =>
                    v.channel && !v.channel.toLowerCase().includes('kwa')
                );

                if (validVideos.length > 0) {
                    const fallbackImage = `https://i.ytimg.com/vi/${validVideos[0].videoId}/hqdefault.jpg`;
                    recipe.image_url = fallbackImage;
                    recipe._image_source = 'youtube_thumbnail';
                    console.log(`Fixed thumbnail for ${recipe.slug}: ${fallbackImage}`);
                    changed = true;
                } else {
                    console.log(`Could not fix ${recipe.slug}: No valid non-KWA videos found.`);
                }
            }
        }
    });

    if (changed) {
        fs.writeFileSync(RECIPES_FILE, JSON.stringify(recipes, null, 2));
        console.log('Saved recipes.json with updated thumbnails.');
    } else {
        console.log('No recipes needed thumbnail fixing.');
    }
}

fixRecipeThumbnails();
