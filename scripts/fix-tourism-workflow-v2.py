import json
import os

file_path = r'c:\Users\leonp\recetas-ecuador\n8n-exports\turismo_workflow.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Fix encoding issues again, more broadly
def fix_encoding(text):
    if not isinstance(text, str): return text
    # Common n8n expressions and JS strings
    text = text.replace('artÃ­culo', 'artículo')
    text = text.replace('artÃ­culos', 'artículos')
    text = text.replace('especÃ­fico', 'específico')
    text = text.replace('especÃ­fica', 'específica')
    text = text.replace('Ãºnico', 'único')
    text = text.replace('Ãºnicos', 'únicos')
    text = text.replace('Ãºnica', 'única')
    text = text.replace('Ãºnicas', 'únicas')
    text = text.replace('guÃ­a', 'guía')
    text = text.replace('optimizaciÃ³n', 'optimización')
    text = text.replace('espaÃ±ol', 'español')
    text = text.replace('fallÃ³', 'falló')
    text = text.replace('generÃ³', 'generó')
    text = text.replace('tambiÃ©n', 'también')
    text = text.replace('mÃ¡s', 'más')
    text = text.replace('Ã©poca', 'época')
    text = text.replace('invÃ¡lido', 'inválido')
    text = text.replace('vacÃ­o', 'vacío')
    text = text.replace('informaciÃ³n', 'información')
    text = text.replace('festividad', 'festividad')
    text = text.replace('â€”', '—')
    text = text.replace('Ã¡', 'á')
    text = text.replace('Ã©', 'é')
    text = text.replace('Ã­', 'í')
    text = text.replace('Ã³', 'ó')
    text = text.replace('Ãº', 'ú')
    text = text.replace('Ã±', 'ñ')
    return text

def process_node(obj):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == 'jsCode' or k == 'jsonBody':
                obj[k] = fix_encoding(v)
            else:
                obj[k] = process_node(v)
    elif isinstance(obj, list):
        for i in range(len(obj)):
            obj[i] = process_node(obj[i])
    return obj

data = process_node(data)

# Find 'preparar-prompt-turismo' and add error handling
new_js_code = r"""const topicFinderNode = $('Topic Finder').first();
const topicResult = topicFinderNode.json;

if (!topicResult.choices || !topicResult.choices[0]) {
  const errorMsg = topicResult.error ? topicResult.error.message : 'Respuesta incompleta de la IA';
  throw new Error(`Error en Topic Finder: ${errorMsg}. Payload: ${JSON.stringify(topicResult).slice(0, 500)}`);
}

const topic = topicResult.choices[0].message.content.trim();
const existingTitles = $('Extraer temas existentes').first().json.existingTitles || [];

const systemPrompt =
  'Eres un periodista y escritor de viajes especializado en Ecuador. Combinas el ' +
  'conocimiento de un guía de turismo experto, la narrativa de un periodista de viajes ' +
  'y la optimización de un experto en SEO para Google. Escribes en español de Ecuador, ' +
  'de forma amena, informativa y atractiva.';

const userPrompt =
  'Escribe un articulo de blog turistico completo sobre: ' + topic + '\n\n' +
  'Temas YA publicados (NO repetir): ' + existingTitles.slice(0, 20).join(', ') + '\n\n' +
  'INSTRUCCIONES DE CONTENIDO:\n' +
  '- Articulo de 600-900 palabras en HTML rico\n' +
  '- Usa h2 para secciones principales, h3 para subsecciones\n' +
  '- Parrafos con p, listas con ul/li, enfasis con strong\n' +
  '- Primer parrafo: menciona la keyword principal del tema, es la mas importante para SEO\n' +
  '- Incluye informacion practica: como llegar, que hacer, donde comer, mejor epoca para visitar\n' +
  '- Usa informacion actual (2025-2026) obtenida de tu busqueda web\n' +
  '- Tono: amigable, informativo, que inspire a visitar Ecuador\n\n' +
  'SEO CRITICO - POSICIONAR #1 EN GOOGLE:\n' +
  '- "title": max 60 chars, keyword principal al inicio (ej: "Galapagos Ecuador 2026: Guia Completa")\n' +
  '- "description": EMPIEZA con la keyword. 150-155 chars exactos. No copiar el titulo.\n' +
  '- "keywords": 8-12 terminos que la gente busca: destino, visitar lugar, lugar 2026, que hacer, como llegar\n' +
  '- "content": HTML del articulo. Primera linea menciona keyword. H2s con keywords naturales.\n' +
  '- "faqs": EXACTAMENTE 3 preguntas reales de Google sobre el tema:\n' +
  '  [{q: "Cuanto cuesta ir al destino?", a: "Respuesta directa 1-2 oraciones"},\n' +
  '   {q: "Cual es la mejor epoca para visitar?", a: "..."},\n' +
  '   {q: "Que documentos necesito para visitar Ecuador?", a: "..."}]\n\n' +
  'RESPONDE UNICAMENTE con un objeto JSON valido (sin markdown, sin backticks):\n' +
  '{\n' +
  '  "title": "Titulo SEO max 60 chars",\n' +
  '  "subtitle": "Subtitulo descriptivo corto",\n' +
  '  "slug": "titulo-en-kebab-case-sin-acentos",\n' +
  '  "description": "155 chars max, keyword al inicio",\n' +
  '  "category": "Rutas|Destinos|Cultura|Festividades|Naturaleza|Aventura|Gastronomia",\n' +
  '  "region": "Sierra|Costa|Amazonia|Galapagos|Nacional"\n' +
  '}\n';

const payload = {
  model: 'grok-3-mini',
  max_tokens: 4000,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]
};

return [{ json: { payload: payload } }];"""

for node in data['nodes']:
    if node['id'] == 'preparar-prompt-turismo':
        node['parameters']['jsCode'] = new_js_code

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Fixed tourism_workflow.json properly.")
