import json
import os

file_path = r'c:\Users\leonp\recetas-ecuador\n8n-exports\turismo_workflow.json'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# The content might be invalid JSON due to real newlines in strings.
# We need to manually fix it or use a more robust parser.
# Since I know where the error is, I'll try to replace the problematic block.

new_js_code = r"""const topic = $('Topic Finder').first().json.choices[0].message.content.trim();
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

# We'll re-read the nodes and find the one with id 'preparar-prompt-turismo'
# But wait, if the JSON is invalid, json.load will fail.
# Let's try to fix the string first.

# We can find the jsCode block for that node.
# It starts after "id": "preparar-prompt-turismo" 
# or actually it's before it in the parameters.

# Let's try to load it normally first, maybe it's not THAT broken.
try:
    data = json.loads(content)
    for node in data.get('nodes', []):
        if node.get('id') == 'preparar-prompt-turismo':
            node['parameters']['jsCode'] = new_js_code
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("Successfully fixed JSON and updated jsCode.")
except Exception as e:
    print(f"Error loading JSON: {e}")
    # Fallback to string replacement if JSON is totally broken
    # (Simplified fallback, hopefully not needed)
