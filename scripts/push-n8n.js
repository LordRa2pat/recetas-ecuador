const fs = require('fs');

async function updateWorkflow(workflowId, filePath) {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Removing fields that might cause "additional properties" error
    delete content.workflowId;
    delete content.createdAt;
    delete content.updatedAt;
    delete content.activeVersion;
    delete content.active;
    content.settings = content.settings || {};

    console.log(`Updating workflow ${workflowId} with data from ${filePath}...`);

    try {
        const response = await fetch(`https://n8n-n8n.tlsfxv.easypanel.host/api/v1/workflows/${workflowId}`, {
            method: 'PUT',
            headers: {
                'X-N8N-API-KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmE3MDQ0ZC1jZjg0LTQ4OGUtYWFmOC03N2JmMDAzZGYyMjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYzFjYTA1OTEtNWRlNC00N2EyLTlmZjItODVkYjgwNjA4NGFlIiwiaWF0IjoxNzcyMDM2ODE2fQ.tAuTzhiTmMj7NntSvQenynnm5w0bfbOVrTxbeiWLXB0',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(content)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        console.log(`Success for ${workflowId}!`);
    } catch (e) {
        console.error(`Error updating ${workflowId}:`, e.message);
    }
}

async function main() {
    const envContent = fs.readFileSync('.env', 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) process.env[key.trim()] = valueParts.join('=').trim();
    });
    await updateWorkflow('SHRZnCATkL1FX9jo', 'n8n-exports/recetas_workflow.json');
    await updateWorkflow('grhUOia7e869tqSN', 'n8n-exports/turismo_workflow.json');
}

main();
