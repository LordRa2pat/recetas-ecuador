import json
import os
import re

def fix_mangled_utf8(text):
    replacements = {
        'fallÃ³': 'falló',
        'tambiÃ©n': 'también',
        'invÃ¡lido': 'inválido',
        'invÃ¡lida': 'inválida',
        'vacÃ­o': 'vacío',
        'especÃ­fico': 'específico',
        'especÃ­fica': 'específica',
        'artÃ­culos': 'artículos',
        'guÃ­a': 'guía',
        'optimizaciÃ³n': 'optimización',
        'espaÃ±ol': 'español',
        'â€”': '—',
        'generÃ³': 'generó',
        'Ãºnicos': 'únicos',
        'temas ya publicados': 'temas ya publicados',
        'festividad': 'festividad',
        'informaciÃ³n': 'información',
        'falla': 'falla',
        'mÃ¡s': 'más',
        'Ã©poca': 'época',
        'Ãºnico': 'único',
    }
    for mangled, fixed in replacements.items():
        text = text.replace(mangled, fixed)
    return text

def fix_workflow(file_path):
    if not os.path.exists(file_path):
        return
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Recursively fix all strings in the JSON
    def process(obj):
        if isinstance(obj, str):
            return fix_mangled_utf8(obj)
        elif isinstance(obj, list):
            return [process(item) for item in obj]
        elif isinstance(obj, dict):
            return {k: process(v) for k, v in obj.items()}
        return obj

    data = process(data)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Fixed {file_path}")

fix_workflow(r'c:\Users\leonp\recetas-ecuador\n8n-exports\turismo_workflow.json')
fix_workflow(r'c:\Users\leonp\recetas-ecuador\n8n-exports\recetas_workflow.json')
