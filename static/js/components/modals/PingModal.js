import { showToast, getApiError, formatPingResult } from '../../utils/formatters.js';

/**
 * PingModal — Encapsulates the Agent Ping modal form and result display.
 *
 * Replaces the global functions `submitAgentPing()` and `populateNodeSelect()`
 * from qn.js.
 *
 * Usage:
 *   const pingModal = new PingModal('AgentPingModal', { tokenCallbacks });
 *   pingModal.populateNodeSelect(nodeList);
 *   pingModal.submit();
 */
export class PingModal {
    /**
     * @param {string} modalId - ID of the modal element
     * @param {Object} [options]
     * @param {Object} [options.tokenCallbacks] - Reference to the token callback registry
     */
    constructor(modalId, options = {}) {
        this._modalId = modalId;
        this._tokenCallbacks = options.tokenCallbacks || {};
        this._receivedMessages = 0;
        this._pingResults = [];
    }

    /**
     * Populate the multi-select node dropdown.
     * @param {Array} nodes - Array of node objects with systemSettings.ID
     */
    populateNodeSelect(nodes) {
        const nodeSelect = document.getElementById('nodeSelect');
        if (!nodeSelect) return;
        nodeSelect.innerHTML = '';

        nodes.forEach(node => {
            const option = document.createElement('option');
            option.value = node.systemSettings.ID;
            option.textContent = node.systemSettings.ID;
            nodeSelect.appendChild(option);
        });
    }

    /**
     * Submit the agent ping form.
     */
    submit() {
        const selectedNodes = Array.from(
            document.getElementById('nodeSelect').selectedOptions
        ).map(opt => opt.value);
        const iterations = document.getElementById('iterations').value;

        // Reset tracking
        this._receivedMessages = 0;
        this._pingResults = [];
        document.getElementById('pingResults').value = 'Ping submitted. Waiting for results...\n';

        const params = new URLSearchParams();
        selectedNodes.forEach(node => params.append('remotes', node));
        params.append('iterations', iterations);

        fetch(`api/pingpong?${params.toString()}`, { method: 'POST' })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(body => {
                        throw new Error(body.detail || body.error || `Request failed (${response.status})`);
                    }).catch(parseErr => {
                        if (parseErr.message && parseErr.message !== 'Request failed') throw parseErr;
                        throw new Error(`Request failed with status ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                const apiErr = getApiError(data);
                if (apiErr) {
                    document.getElementById('pingResults').value = 'Ping failed: ' + apiErr;
                    showToast('Ping failed: ' + apiErr, 'danger');
                    return;
                }

                if (data.token) {
                    const token = 'pong-' + data.token;
                    document.getElementById('pingResults').value += `Token: ${token}\n`;

                    this._tokenCallbacks[token] = (message) => {
                        const formattedResult = formatPingResult(message);
                        this._pingResults.push(formattedResult);
                        this._receivedMessages++;
                        document.getElementById('pingResults').value =
                            this._pingResults.join('\n\n');
                    };
                } else {
                    document.getElementById('pingResults').value = 'No token received from server.';
                }
            })
            .catch(error => {
                console.error('Ping Request Failed:', error);
                document.getElementById('pingResults').value = 'Ping failed: ' + error.message;
                showToast('Ping failed: ' + error.message, 'danger');
            });
    }
}
