const fs = require('fs');
const path = require('path');

const RECETAS_FILE = 'C:/Users/leonp/.gemini/antigravity/brain/affa3f51-579f-47cb-b2a3-d000592c02ce/.system_generated/steps/656/output.txt';
const TURISMO_FILE = 'C:/Users/leonp/.gemini/antigravity/brain/affa3f51-579f-47cb-b2a3-d000592c02ce/.system_generated/steps/657/output.txt';

function extractJson(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/Retrieved workflow: [^\n]+\n\n([\s\S]+)/);
    if (!match) throw new Error('Could not find JSON in ' + filePath);
    return JSON.parse(match[1]);
}

const recetas = extractJson(RECETAS_FILE);
const turismo = extractJson(TURISMO_FILE);

// Fix Recetas
function updateRecetasNode(nodes) {
    const node = nodes.find(n => n.name === 'Generar Imagen IA');
    if (node) {
        node.parameters.jsCode = node.parameters.jsCode.replace(
            /let queryConcept = recipe\.title;[\s\S]*?const query = encodeURIComponent\([^)]+\);/,
            `let queryConcept = recipe.title;
if (recipe.image_keywords && Array.isArray(recipe.image_keywords) && recipe.image_keywords.length > 0) {
    queryConcept = recipe.image_keywords[0];
}
const query = encodeURIComponent(\`\${queryConcept} plato tipico comida ecuatoriana\`);`
        );
    }
}
updateRecetasNode(recetas.nodes);
if (recetas.activeVersion && recetas.activeVersion.nodes) {
    updateRecetasNode(recetas.activeVersion.nodes);
}

// Fix Turismo
function updateTurismoNode(nodes) {
    const node = nodes.find(n => n.name === 'Generar Imagen IA');
    if (node) {
        node.parameters.jsCode = node.parameters.jsCode.replace(
            /let queryConcept = recipe\.title;[\s\S]*?const query = encodeURIComponent\([^)]+\);/,
            `let queryConcept = recipe.title;
if (recipe.keywords && Array.isArray(recipe.keywords) && recipe.keywords.length > 0) {
    queryConcept = recipe.keywords[0];
}
const query = encodeURIComponent(\`\${queryConcept} turismo ecuador paisaje viaje hd\`);`
        );
    }
}
updateTurismoNode(turismo.nodes);
if (turismo.activeVersion && turismo.activeVersion.nodes) {
    updateTurismoNode(turismo.activeVersion.nodes);
}

fs.writeFileSync('C:/Users/leonp/recetas-ecuador/.gemini/recetas_workflow.json', JSON.stringify({
    workflowId: recetas.id,
    name: recetas.name,
    active: recetas.active,
    nodes: recetas.activeVersion ? recetas.activeVersion.nodes : recetas.nodes,
    connections: recetas.connections
}, null, 2));

fs.writeFileSync('C:/Users/leonp/recetas-ecuador/.gemini/turismo_workflow.json', JSON.stringify({
    workflowId: turismo.id,
    name: turismo.name,
    active: turismo.active,
    nodes: turismo.activeVersion ? turismo.activeVersion.nodes : turismo.nodes,
    connections: turismo.connections
}, null, 2));

console.log('Successfully prepared workflows!');
