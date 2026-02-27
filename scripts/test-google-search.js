const fs = require('fs');
// try dotenv first, fallback to native parsing if missing
const envContent = fs.readFileSync('.env', 'utf8');
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) process.env[key.trim()] = valueParts.join('=').trim();
});

async function testGoogleSearch() {
    const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
    const GOOGLE_CX = process.env.GOOGLE_CX;

    // Simulate what the workflow did
    // The recipe had title "Sopa de Quinoa Ecuatoriana Receta de la Sierra Sur"
    // Let's assume image_keywords wasn't populated or was just the title
    let queryConcept = "Sopa de Quinoa Ecuatoriana Receta de la Sierra Sur";

    // Check if we can get a result for this exact query
    const query = encodeURIComponent(`${queryConcept} plato tipico comida ecuatoriana`);
    const searchUrl = `https://www.googleapis.com/customsearch/v1?q=${query}&searchType=image&cx=${GOOGLE_CX}&key=${GOOGLE_API_KEY}&num=1`;

    console.log('Fetching:', searchUrl);

    try {
        const resp = await fetch(searchUrl);
        const data = await resp.json();

        if (resp.ok) {
            console.log('Search successful!');
            if (data.items && data.items.length > 0) {
                console.log('Found image:', data.items[0].link);
            } else {
                console.log('NO ITEMS FOUND IN RESPONSE!');
                console.log('Response data:', JSON.stringify(data, null, 2));
            }
        } else {
            console.error('API Error:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('Network Error:', e.message);
    }
}

testGoogleSearch();
