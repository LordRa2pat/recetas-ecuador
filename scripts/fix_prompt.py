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
    print(f"Fetching & Modifying {name}...")
    try:
        r = requests.get(BASE_URL + wid, headers=headers)
        r.raise_for_status()
        workflow = r.json()
    except Exception as e:
        print("Failed to fetch", wid, e)
        continue
    
    modified = False
    for node in workflow.get("nodes", []):
        if "Prompt" in node.get("name", "") or "Chef" in node.get("name", ""):
            code = node["parameters"].get("jsCode", "")
            if not code:
                continue
            
            original_code = code

            # In W1: remove `+ imageList +` line entirely or replace with blank
            # Specifically targeting: '  "image_url": "Elige URL MAS APROPIADA segun categoria del plato:\n' + imageList + '\nNUNCA uses photo-XXXX. Elige URL completa de la lista.",\n' +
            
            # This regex looks for image_url line and an interpolation of imageList, up to the end of that string concat
            code = re.sub(r'\'\s*"image_url":.*?imageList.*?\',\s*\n\s*\+\s*', '', code, flags=re.DOTALL)
            code = re.sub(r'\'\s*"image_url":.*?\',\s*\n\s*\+\s*', '', code, flags=re.DOTALL)
            # Remove imageList definition if it somehow exists
            code = re.sub(r'const imageList = \[.*?\]\.join\(\'\\n\'\);\s*', '', code, flags=re.DOTALL)

            if code != original_code:
                node["parameters"]["jsCode"] = code
                modified = True
                print(f" -> Patched node: {node['name']}")
                
    if modified:
        payload = {
            "name": workflow.get("name"),
            "nodes": workflow.get("nodes"),
            "connections": workflow.get("connections"),
            "settings": workflow.get("settings", {}),
            "staticData": workflow.get("staticData", None),
            "meta": workflow.get("meta", None)
        }
        payload = {k: v for k, v in payload.items() if v is not None}
        
        try:
            put_r = requests.put(BASE_URL + wid, headers=headers, json=payload)
            put_r.raise_for_status()
            print(f" -> Successfully uploaded modified workflow {name}")
        except Exception as e:
            print(f" -> ERROR uploading: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(e.response.text)
    else:
        print(f" -> No modifications needed for {name}")
