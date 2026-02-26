import json
import re
import requests
import ast

API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmE3MDQ0ZC1jZjg0LTQ4OGUtYWFmOC03N2JmMDAzZGYyMjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYzFjYTA1OTEtNWRlNC00N2EyLTlmZjItODVkYjgwNjA4NGFlIiwiaWF0IjoxNzcyMDM2ODE2fQ.tAuTzhiTmMj7NntSvQenynnm5w0bfbOVrTxbeiWLXB0"
BASE_URL = "https://n8n-n8n.tlsfxv.easypanel.host/api/v1/workflows/"
headers = {"X-N8n-Api-Key": API_KEY, "Content-Type": "application/json"}

w1_path = r"C:\Users\leonp\.gemini\antigravity\brain\ca40ccfd-db8a-438e-ae79-d42d8dc3fb14\.system_generated\steps\776\output.txt"
w2_path = r"C:\Users\leonp\.gemini\antigravity\brain\ca40ccfd-db8a-438e-ae79-d42d8dc3fb14\.system_generated\steps\777\output.txt"

FILES = [
    ("RECETAS-AI-Auto-Publisher-v3", "SHRZnCATkL1FX9jo", w1_path),
    ("TURISMO-AI-Auto-Publisher-v2", "grhUOia7e869tqSN", w2_path)
]

for name, wid, path in FILES:
    print(f"Modifying {name} from local MCP dump...")
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
            # the MCP output format is usually exactly the JSON API response, but let's check
            # if it has extra text
            start = content.find('{')
            end = content.rfind('}') + 1
            if start == -1 or end == 0:
                print("No JSON found in", path)
                continue
            
            # The output of mcp_n8n_get_workflow might be wrapped in some text or might actually be string representation. Let's try to load it. 
            workflow_raw = content[start:end]
            # Replace single quotes containing JSON with double? Wait, if MCP spits out Python dict syntax, ast.literal_eval is needed.
            try:
                workflow = json.loads(workflow_raw)
            except json.JSONDecodeError:
                # Fallback if the MCP returned python string representation
                workflow = ast.literal_eval(workflow_raw)
                
    except Exception as e:
        print("Failed to read", e)
        continue
    
    modified = False
    
    # ensure it has nodes
    if "nodes" not in workflow:
        print("No nodes in workflow structure!")
        continue
        
    for node in workflow.get("nodes", []):
        if "Prompt" in node.get("name", ""):
            code = node.get("parameters", {}).get("jsCode", "")
            if not code:
                continue
            
            # Remove imageUrl schema
            new_code = re.sub(r'\'\s*"image_url".*?\',\s*\n\s*\+\s*', '', code, flags=re.DOTALL)
            new_code = re.sub(r'\'\s*"image_url".*?\',\s*\n', '', new_code, flags=re.DOTALL)
            new_code = re.sub(r'\'\s*"image_url": "URL completa de Unsplash elegida de la lista",\s*\\n\'\s*\+\s*', '', new_code, flags=re.DOTALL)
            new_code = new_code.replace('"Elige URL MAS APROPIADA segun categoria del plato:\n""\nNUNCA uses photo-XXXX. Elige URL completa de la lista.",\n', '')
            
            # Fix if we accidentally left trailing pluses
            new_code = re.sub(r'\+\s*\+\s*', '+ ', new_code)
            
            if new_code != code:
                node["parameters"]["jsCode"] = new_code
                modified = True
                print(f" -> Removed image_url from Prompt in {name} ({node['name']})")
                
        if "Generar" in node.get("name", ""):
            code = node.get("parameters", {}).get("jsCode", "")
            if not code:
                continue
            
            # Broaden search query:
            # from: const query = encodeURIComponent(`${queryConcept} comida plato ecuador real photography -pinterest`);
            # to: const query = encodeURIComponent(`${queryConcept} ecuador food dish real photography`);
            new_code = code.replace(
                "const query = encodeURIComponent(`${queryConcept} comida plato ecuador real photography -pinterest`);", 
                "const query = encodeURIComponent(`${queryConcept} ecuador dish recipe`);"
            )
            # Add timeout to fetches to match robust usage
            if "AbortSignal" not in new_code:
                new_code = new_code.replace("fetch(searchUrl)", "fetch(searchUrl, { signal: AbortSignal.timeout(10000) })")
                
            if new_code != code:
                node["parameters"]["jsCode"] = new_code
                modified = True
                print(f" -> Broadened Google Search query in {name}")
                
    if modified:
        payload = {k: v for k, v in workflow.items() if k in ["name", "nodes", "connections", "settings", "staticData", "meta"]}
        if 'id' in payload: del payload['id']
        try:
            print(f" -> Uploading {name} with 60s timeout...")
            put_r = requests.put(BASE_URL + wid, headers=headers, json=payload, timeout=60)
            put_r.raise_for_status()
            print(f" -> SUCCESS Uploaded {name}")
        except Exception as e:
            print(f" -> ERROR uploading: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(e.response.text)
    else:
        print(f" -> No node modifications were needed for {name}")

print("Done.")
