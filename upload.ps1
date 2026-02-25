$json = Get-Content -Raw "c:\Users\leonp\recetas-ecuador\RSS-Quora-to-Avatar-YouTube.json" | ConvertFrom-Json
$payload = @{
    name = $json.name
    nodes = $json.nodes
    connections = $json.connections
    settings = @{
        executionOrder = $json.settings.executionOrder
    }
}
$body = $payload | ConvertTo-Json -Depth 10 -Compress
$headers = @{
    "X-N8N-API-KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmE3MDQ0ZC1jZjg0LTQ4OGUtYWFmOC03N2JmMDAzZGYyMjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYzFjYTA1OTEtNWRlNC00N2EyLTlmZjItODVkYjgwNjA4NGFlIiwiaWF0IjoxNzcyMDM2ODE2fQ.tAuTzhiTmMj7NntSvQenynnm5w0bfbOVrTxbeiWLXB0"
    "Content-Type"  = "application/json"
    "Accept"        = "application/json"
}
$response = Invoke-RestMethod -Uri "https://n8n-n8n.tlsfxv.easypanel.host/api/v1/workflows/XhDhxG2kFpb6o_3m1tia5" -Method Put -Headers $headers -Body $body
$response | ConvertTo-Json -Depth 10
