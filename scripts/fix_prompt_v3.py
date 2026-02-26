import requests
import json
import re

API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmE3MDQ0ZC1jZjg0LTQ4OGUtYWFmOC03N2JmMDAzZGYyMjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYzFjYTA1OTEtNWRlNC00N2EyLTlmZjItODVkYjgwNjA4NGFlIiwiaWF0IjoxNzcyMDM2ODE2fQ.tAuTzhiTmMj7NntSvQenynnm5w0bfbOVrTxbeiWLXB0"
BASE_URL = "https://n8n-n8n.tlsfxv.easypanel.host/api/v1/workflows/"
headers = {"X-N8n-Api-Key": API_KEY, "Content-Type": "application/json"}

FILES = [
    ("RECETAS-AI-Auto-Publisher-v3", "SHRZnCATkL1FX9jo"),
    ("TURISMO-AI-Auto-Publisher-v2", "grhUOia7e869tqSN")
]

for name, wid in FILES:
    print(f"Modifying {name}...")
    try:
        workflow = requests.get(BASE_URL + wid, headers=headers, timeout=15).json()
    except Exception as e:
        print("Failed to fetch", e)
        continue
    
    modified = False
    for node in workflow.get("nodes", []):
        if "Prompt" in node.get("name", ""):
            code = node.get("parameters", {}).get("jsCode", "")
            if not code:
                continue
            
            # W1: remove entire 'image_url' line from string concat
            new_code = re.sub(r'\'\s*"image_url".*?\',\s*\n\s*\+\s*', '', code, flags=re.DOTALL)
            new_code = re.sub(r'\'\s*"image_url".*?\',\s*\n', '', new_code, flags=re.DOTALL)
            
            # W2: also might have it
            new_code = re.sub(r'\'\s*"image_url": "URL completa de Unsplash elegida de la lista",\s*\\n\'\s*\+\s*', '', new_code, flags=re.DOTALL)
            
            if new_code != code:
                node["parameters"]["jsCode"] = new_code
                modified = True
                print(f" -> Removed image_url from Prompt in {name}")
                
        # Fix the Generar Imagen node Google Search to be ultra-broad so it never fails
        if "Generar" in node.get("name", ""):
            code = node.get("parameters", {}).get("jsCode", "")
            if not code:
                continue
            new_code = code.replace(
                "const query = encodeURIComponent(`${queryConcept} comida plato ecuador real photography -pinterest`);", 
                "const query = encodeURIComponent(`${queryConcept} ecuador dish`);"
            )
            # Add timeout to fetches
            new_code = new_code.replace("fetch(searchUrl)", "fetch(searchUrl, { signal: AbortSignal.timeout(10000) })")
            if new_code != code:
                node["parameters"]["jsCode"] = new_code
                modified = True
                print(f" -> Broadened Google Search query in {name}")
                
    if modified:
        payload = {k: v for k, v in workflow.items() if k in ["name", "nodes", "connections", "settings", "staticData", "meta"]}
        try:
            put_r = requests.put(BASE_URL + wid, headers=headers, json=payload, timeout=15)
            print(f" -> Uploaded {name}")
        except Exception as e:
            print(f" -> ERROR uploading: {e}")

