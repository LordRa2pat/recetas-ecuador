const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmE3MDQ0ZC1jZjg0LTQ4OGUtYWFmOC03N2JmMDAzZGYyMjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYzFjYTA1OTEtNWRlNC00N2EyLTlmZjItODVkYjgwNjA4NGFlIiwiaWF0IjoxNzcyMDM2ODE2fQ.tAuTzhiTmMj7NntSvQenynnm5w0bfbOVrTxbeiWLXB0';
const BASE_URL = 'https://n8n-n8n.tlsfxv.easypanel.host/api/v1';

async function fetchExecutionDetails(id) {
    try {
        const response = await fetch(`${BASE_URL}/executions/${id}`, {
            headers: { 'X-N8N-API-KEY': API_KEY }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const exec = await response.json();
        console.log(`--- DETAILS FOR EXECUTION ${id} ---`);
        if (exec.data && exec.data.resultData && exec.data.resultData.runData) {
            for (const nodeName in exec.data.resultData.runData) {
                const runEvents = exec.data.resultData.runData[nodeName];
                for (const run of runEvents) {
                    if (run.error) {
                        console.log(`ERROR in Node [${nodeName}]: ${run.error.message}`);
                        if (run.error.stack) console.log(`Stack: ${run.error.stack}`);
                        if (run.error.description) console.log(`Description: ${run.error.description}`);
                    }
                }
            }
        }
    } catch (error) {
        console.error(`Error fetching details for ${id}:`, error.message);
    }
}

async function fetchExecutions() {
    try {
        const response = await fetch(`${BASE_URL}/executions?limit=10&status=error`, {
            headers: { 'X-N8N-API-KEY': API_KEY }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const executions = data.data || [];
        console.log(`Recent failed executions: ${executions.length}`);
        if (executions.length > 0) {
            for (const exec of executions) {
                console.log(`- Execution ID: ${exec.id} | Workflow: ${exec.workflowId} | Finished: ${exec.finished}`);
                await fetchExecutionDetails(exec.id);
            }
        }
    } catch (error) {
        console.error('Error fetching executions:', error.message);
    }
}

fetchExecutions();
