const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmE3MDQ0ZC1jZjg0LTQ4OGUtYWFmOC03N2JmMDAzZGYyMjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYzFjYTA1OTEtNWRlNC00N2EyLTlmZjItODVkYjgwNjA4NGFlIiwiaWF0IjoxNzcyMDM2ODE2fQ.tAuTzhiTmMj7NntSvQenynnm5w0bfbOVrTxbeiWLXB0';
const BASE_URL = 'https://n8n-n8n.tlsfxv.easypanel.host/api/v1';
const WORKFLOW_ID = 'grhUOia7e869tqSN';

async function updateWorkflow() {
    try {
        // 1. Get current workflow
        const getResp = await fetch(`${BASE_URL}/workflows/${WORKFLOW_ID}`, {
            headers: { 'X-N8N-API-KEY': API_KEY }
        });
        if (!getResp.ok) throw new Error(`Fetch error: ${getResp.status}`);
        const workflow = await getResp.json();

        // 2. Modify nodes
        workflow.nodes.forEach(node => {
            if (node.name === 'Topic Finder' || node.name === 'Article Writer') {
                node.parameters.authentication = 'genericCredentialType';
                node.parameters.genericAuthType = 'httpHeaderAuth';

                // Remove manual Authorization header
                if (node.parameters.headerParameters && node.parameters.headerParameters.parameters) {
                    node.parameters.headerParameters.parameters = node.parameters.headerParameters.parameters.filter(
                        p => p.name !== 'Authorization'
                    );
                }

                // Add credential
                node.credentials = {
                    httpHeaderAuth: {
                        id: 'TdFWRkceiolfRm6j',
                        name: 'Header Auth account'
                    }
                };
            }

            // Fix GitHub nodes
            if (node.name === 'GET posts existentes' || node.name === 'GET posts.json GitHub' || node.name === 'PUT posts.json a GitHub') {
                node.parameters.authentication = 'predefinedCredentialType';
                node.parameters.nodeCredentialType = 'githubApi';

                // Remove manual Authorization header
                if (node.parameters.headerParameters && node.parameters.headerParameters.parameters) {
                    node.parameters.headerParameters.parameters = node.parameters.headerParameters.parameters.filter(
                        p => p.name !== 'Authorization'
                    );
                }

                // Add credential
                node.credentials = {
                    githubApi: {
                        id: 'ltGQSSEM7dULOCFJ',
                        name: 'GitHub account'
                    }
                };
            }

            if (node.name === 'Sticky Note') {
                node.parameters.content = node.parameters.content.replace(
                    '## TURISMO-AI-Auto-Publisher v3.0',
                    '## TURISMO-AI-Auto-Publisher v3.1\n\n**FIX:** Usando credenciales n8n (Header Auth account) en lugar de $env.XAI_API_KEY.'
                );
            }
        });

        // 3. Update workflow
        const putResp = await fetch(`${BASE_URL}/workflows/${WORKFLOW_ID}`, {
            method: 'PUT',
            headers: {
                'X-N8N-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nodes: workflow.nodes,
                connections: workflow.connections,
                name: workflow.name,
                settings: workflow.settings,
                staticData: workflow.staticData
            })
        });

        if (!putResp.ok) {
            const errorText = await putResp.text();
            throw new Error(`Update error: ${putResp.status} - ${errorText}`);
        }

        console.log('Successfully updated tourism workflow!');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

updateWorkflow();
