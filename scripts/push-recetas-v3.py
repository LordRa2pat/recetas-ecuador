import json
import requests

workflow_id = "SHRZnCATkL1FX9jo"
api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmE3MDQ0ZC1jZjg0LTQ4OGUtYWFmOC03N2JmMDAzZGYyMjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYzFjYTA1OTEtNWRlNC00N2EyLTlmZjItODVkYjgwNjA4NGFlIiwiaWF0IjoxNzcyMDM2ODE2fQ.tAuTzhiTmMj7NntSvQenynnm5w0bfbOVrTxbeiWLXB0"
file_path = "c:\\Users\\leonp\\recetas-ecuador\\n8n-exports\\recetas_workflow.json"

with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# Extract only necessary fields for update
payload = {
    "nodes": data.get("nodes"),
    "connections": data.get("connections"),
    "settings": data.get("settings", {}),
    "name": data.get("name")
}

url = f"https://n8n-n8n.tlsfxv.easypanel.host/api/v1/workflows/{workflow_id}"
headers = {
    "X-N8N-API-KEY": api_key,
    "Content-Type": "application/json"
}

response = requests.put(url, headers=headers, json=payload)

if response.status_code == 200:
    print(f"Workflow {workflow_id} updated successfully.")
else:
    print(f"Error {response.status_code}: {response.text}")
