import { formatList } from '../../utils/formatters.js';

/**
 * ExperimentModal — Encapsulates the Experiment Details modal.
 *
 * Replaces the global `openExperimentModal()` from qn.js.
 *
 * Usage:
 *   const experimentModal = new ExperimentModal('ExperimentDetailsModal');
 *   experimentModal.open(experiment);
 */
export class ExperimentModal {
    /**
     * @param {string} modalId - ID of the modal element
     */
    constructor(modalId) {
        this._modalId = modalId;
    }

    /**
     * Open the experiment details modal with the given experiment data.
     * @param {Object} experiment - Experiment data object
     */
    open(experiment) {
        // Clear previous content
        document.getElementById('ExperimentDetailsContent').innerHTML = '';

        // Set Modal Title
        document.getElementById('ExperimentDetailsModalLabel').textContent =
            `Experiment: ${experiment.id}`;

        let contentHTML = '';

        contentHTML += '<h4>Basic Information</h4>';
        contentHTML += formatList({
            'Experiment ID': experiment.id,
            'Type': experiment.parameters?.exp_name || experiment.type,
            'State': experiment.status?.value || experiment.phase,
            'Created': new Date(experiment.created_at * 1000).toLocaleString(),
            'Updated': experiment.updated_at
                ? new Date(experiment.updated_at * 1000).toLocaleString()
                : 'N/A'
        });

        // Display error information if present
        const topError = experiment.error;
        const resultError = experiment.result?.error;
        const resultErrors = experiment.result?.errors;

        if (topError || resultError || (resultErrors && resultErrors.length > 0)) {
            contentHTML += '<h4 class="text-danger">⚠ Error Details</h4>';
            contentHTML += '<div class="alert alert-danger">';

            if (topError) {
                contentHTML += `<strong>Error:</strong> ${topError}`;
            }
            if (resultError && resultError !== topError) {
                contentHTML += `<p class="mb-1"><strong>Detail:</strong> ${resultError}</p>`;
            }
            if (resultErrors && resultErrors.length > 0) {
                contentHTML += '<hr class="my-2">';
                contentHTML += '<strong>Error Log:</strong>';
                contentHTML += '<ul class="mb-0 mt-1">';
                resultErrors.forEach(e => {
                    const ts = e.timestamp
                        ? new Date(e.timestamp).toLocaleString()
                        : '';
                    contentHTML += `<li>${ts ? `<small class="text-muted">${ts}</small> — ` : ''}${e.error || JSON.stringify(e)}</li>`;
                });
                contentHTML += '</ul>';
            }

            contentHTML += '</div>';
        }

        // Request Information
        if (experiment.request) {
            contentHTML += '<h4>Request Information</h4>';
            contentHTML += formatList(experiment.request);
        }

        // Parameters
        if (experiment.parameters) {
            contentHTML += '<h4>Parameters</h4>';
            contentHTML += formatList({
                'Name': experiment.parameters.exp_name,
                'Path': Array.isArray(experiment.parameters.path)
                    ? experiment.parameters.path.join(' → ')
                    : experiment.parameters.path,
                ...experiment.parameters.exp_params
            });
        }

        // Agent Results
        contentHTML += this._renderResults(experiment, topError, resultError);

        document.getElementById('ExperimentDetailsContent').innerHTML = contentHTML;
        new bootstrap.Modal(document.getElementById(this._modalId)).show();
    }

    /**
     * Render result data — supports both array and dictionary (keyed by agentId) formats.
     * @private
     */
    _renderResults(experiment, topError, resultError) {
        let html = '';

        if (experiment.result && typeof experiment.result === 'object' && !experiment.result.error) {
            const agentResults = Array.isArray(experiment.result)
                ? experiment.result
                : Object.values(experiment.result).filter(v => v && typeof v === 'object' && v.agentId);

            if (agentResults.length > 0) {
                html += '<h4>Agent Results</h4>';
                agentResults.forEach(agent => {
                    html += this._renderAgentResult(agent);
                });
            } else if (!topError && !resultError) {
                html += '<h4>Results</h4>';
                html += '<p>No result data available for this experiment.</p>';
            }
        } else if (!topError && !resultError) {
            html += '<h4>Results</h4>';
            html += '<p>No result data available for this experiment.</p>';
        }

        return html;
    }

    /**
     * Render a single agent result card.
     * @private
     */
    _renderAgentResult(agent) {
        const agentStatus = agent.status?.value || 'Unknown';
        const agentCode = agent.status?.code ?? '?';
        const statusBadge = agentCode === 0
            ? '<span class="badge bg-success">OK</span>'
            : `<span class="badge bg-danger">${agentStatus}</span>`;

        let html = `<div class="card mb-2">`;
        html += `<div class="card-header d-flex justify-content-between align-items-center">`;
        html += `<strong>${agent.agentId}</strong> ${statusBadge}`;
        html += `</div>`;
        html += `<div class="card-body p-2">`;

        if (agent.result) {
            const summaryItems = {};
            Object.entries(agent.result).forEach(([key, value]) => {
                if (key === 'results' && typeof value === 'object') {
                    Object.entries(value).forEach(([plotKey, plotVal]) => {
                        summaryItems[plotKey] = Array.isArray(plotVal)
                            ? `[${plotVal.length} data points]`
                            : plotVal;
                    });
                } else if (Array.isArray(value)) {
                    summaryItems[key] = `[${value.length} items]`;
                } else {
                    summaryItems[key] = value;
                }
            });
            html += formatList(summaryItems);
        } else {
            html += '<p class="text-muted mb-0">No result data</p>';
        }

        html += `</div></div>`;
        return html;
    }
}
