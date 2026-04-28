import { formatList } from '../../utils/formatters.js';

/**
 * CalibrationDetailsModal — Encapsulates the Calibration Details viewer modal.
 *
 * Replaces the global `openCalibrationModal()` from qn.js.
 *
 * Usage:
 *   const calibDetailsModal = new CalibrationDetailsModal('CalibrationDetailsModal');
 *   calibDetailsModal.open(calib);
 */
export class CalibrationDetailsModal {
    /**
     * @param {string} modalId - ID of the modal element
     */
    constructor(modalId) {
        this._modalId = modalId;
    }

    /**
     * Open the calibration details modal with the given calibration data.
     * @param {Object} calib - Calibration data object
     */
    open(calib) {
        document.getElementById('CalibrationDetailsContent').innerHTML = '';
        document.getElementById('CalibrationDetailsModalLabel').textContent =
            `Calibration: ${calib.id}`;

        let contentHTML = '';

        // Basic Information
        const expParams = calib.parameters?.exp_params || {};
        const statusValue = calib.status?.value || calib.phase || 'Unknown';
        const statusCode = calib.status?.code;

        contentHTML += '<h4>Basic Information</h4>';
        contentHTML += formatList({
            'Calibration ID': calib.id,
            'Type': calib.parameters?.exp_name || calib.type || 'Calibration',
            'Status': statusValue,
            'Created': calib.created_at
                ? new Date(calib.created_at * 1000).toLocaleString()
                : 'N/A',
            'Updated': calib.updated_at
                ? new Date(calib.updated_at * 1000).toLocaleString()
                : 'N/A'
        });

        // Error information
        const topError = calib.error;
        const resultError = calib.result?.error;
        const resultErrors = calib.result?.errors;

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

        // Parameters
        if (calib.parameters) {
            contentHTML += '<h4>Parameters</h4>';
            const paramDisplay = {};
            if (calib.parameters.exp_name) paramDisplay['Name'] = calib.parameters.exp_name;
            if (Array.isArray(calib.parameters.path)) {
                paramDisplay['Path'] = calib.parameters.path.join(' → ');
            } else if (calib.parameters.path) {
                paramDisplay['Path'] = calib.parameters.path;
            }
            if (expParams && typeof expParams === 'object') {
                Object.entries(expParams).forEach(([key, value]) => {
                    paramDisplay[key] = value;
                });
            }
            contentHTML += formatList(paramDisplay);
        }

        // Agent Results
        contentHTML += this._renderResults(calib, topError, resultError);

        document.getElementById('CalibrationDetailsContent').innerHTML = contentHTML;
        new bootstrap.Modal(document.getElementById(this._modalId)).show();
    }

    /** @private */
    _renderResults(calib, topError, resultError) {
        let html = '';

        if (calib.result && typeof calib.result === 'object' && !calib.result.error) {
            const agentResults = Array.isArray(calib.result)
                ? calib.result
                : Object.values(calib.result).filter(v => v && typeof v === 'object' && v.agentId);

            if (agentResults.length > 0) {
                html += '<h4>Agent Results</h4>';
                agentResults.forEach(agent => {
                    html += this._renderAgentResult(agent);
                });
            } else if (!topError && !resultError) {
                html += '<h4>Results</h4>';
                html += '<p>No result data available for this calibration.</p>';
            }
        } else if (!topError && !resultError) {
            html += '<h4>Results</h4>';
            html += '<p>No result data available for this calibration.</p>';
        }

        return html;
    }

    /** @private */
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
