const fs = require('fs');

async function fetchExecutions() {
    const response = await fetch(`https://n8n-n8n.tlsfxv.easypanel.host/api/v1/executions?limit=10`, {
        headers: {
            'X-N8N-API-KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmE3MDQ0ZC1jZjg0LTQ4OGUtYWFmOC03N2JmMDAzZGYyMjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYzFjYTA1OTEtNWRlNC00N2EyLTlmZjItODVkYjgwNjA4NGFlIiwiaWF0IjoxNzcyMDM2ODE2fQ.tAuTzhiTmMj7NntSvQenynnm5w0bfbOVrTxbeiWLXB0',
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json();
    console.log('Recent failed executions:');
    let hasFailed = false;
    for (const e of data.data) {
        if (!e.finished || e.status === 'error' || e.status === 'failed' || e.status === 'crashed') {
            hasFailed = true;
            console.log(`- Fetching ID: ${e.id} | Workflow: ${e.workflowId}`);
            await fetchExecutionDetails(e.id);
            break; // just check the latest failed
        }
    }
    if (!hasFailed) {
        if (data.data.length > 0) {
            console.log(`No completely failed executions. Fetching latest (${data.data[0].id}) just in case...`);
            await fetchExecutionDetails(data.data[0].id);
        }
    }
}

async function fetchExecutionDetails(execId) {
    const response = await fetch(`https://n8n-n8n.tlsfxv.easypanel.host/api/v1/executions/${execId}?includeData=true`, {
        headers: {
            'X-N8N-API-KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmE3MDQ0ZC1jZjg0LTQ4OGUtYWFmOC03N2JmMDAzZGYyMjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYzFjYTA1OTEtNWRlNC00N2EyLTlmZjItODVkYjgwNjA4NGFlIiwiaWF0IjoxNzcyMDM2ODE2fQ.tAuTzhiTmMj7NntSvQenynnm5w0bfbOVrTxbeiWLXB0',
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json();
    console.log(`--- DETAILS FOR EXECUTION ${execId} ---`);
    if (data.data.resultData && data.data.resultData.runData) {
        const runData = data.data.resultData.runData;
        for (const [nodeName, nodeExecs] of Object.entries(runData)) {
            for (const exec of nodeExecs) {
                if (exec.error) {
                    console.log(`ERROR in Node [${nodeName}]:`, exec.error.message || exec.error);
                }
            }
        }
    } else {
        console.log('Could not find runData');
    }
}

fetchExecutions().catch(console.error);
