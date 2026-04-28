import { showToast, getApiError } from '../../utils/formatters.js';

/**
 * CalibrationFormModal — Encapsulates the calibration submission form modal,
 * including dropdown population for calibration type, source/destination agents,
 * and bell state type.
 *
 * Replaces the global functions `submitCalibration()`, `populateCalibrationTypeDropdown()`,
 * `populateAgentDropdowns()`, and `populatebellStateTypeDropdown()` from qn.js.
 *
 * Usage:
 *   const calibFormModal = new CalibrationFormModal('CalibrationModal');
 *   calibFormModal.populateDropdowns(calTypeMap, nodeList);
 */
export class CalibrationFormModal {
    /**
     * @param {string} modalId - ID of the modal element
     */
    constructor(modalId) {
        this._modalId = modalId;
    }

    /**
     * Populate all dropdowns needed by the calibration and EGP forms.
     * @param {Object} calTypeMap - Map of calibration type ID → label
     * @param {Array} nodeList - Array of node objects with systemSettings.ID
     */
    populateDropdowns(calTypeMap, nodeList) {
        this._populateCalibrationTypeDropdown(calTypeMap);
        this._populateAgentDropdowns(nodeList);
        this._populateBellStateTypeDropdown();
    }

    /**
     * Submit the calibration form.
     */
    submit() {
        const type = document.getElementById('calibrationType').value;
        const src = document.getElementById('source').value;
        const dst = document.getElementById('destination').value;
        const power = document.getElementById('power').value;
        const light = document.getElementById('light').value;

        const params = new URLSearchParams({ type, src, dst, power, light });

        fetch(`api/calibrate?${params.toString()}`, { method: 'POST' })
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
                console.log('Calibration Submitted:', data);
                const apiErr = getApiError(data);
                if (apiErr) {
                    showToast(`Calibration failed: ${apiErr}`, 'danger');
                    return;
                }
                bootstrap.Modal.getInstance(document.getElementById(this._modalId)).hide();
                showToast('Calibration submitted successfully', 'success');
            })
            .catch(error => {
                console.error('Calibration Submission Failed:', error);
                showToast('Calibration request failed: ' + error.message, 'danger');
            });
    }

    /** @private */
    _populateCalibrationTypeDropdown(calibrationTypeMap) {
        const select = document.getElementById('calibrationType');
        if (!select) return;
        select.innerHTML = '';

        Object.entries(calibrationTypeMap).forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            select.appendChild(option);
        });
    }

    /** @private */
    _populateAgentDropdowns(nodes) {
        const sourceSelect = document.getElementById('source');
        const destinationSelect = document.getElementById('destination');
        const egpSource = document.getElementById('egpSource');
        const egpDestination = document.getElementById('egpDestination');

        if (sourceSelect) sourceSelect.innerHTML = '';
        if (destinationSelect) destinationSelect.innerHTML = '';

        nodes.forEach(node => {
            const option = document.createElement('option');
            option.value = node.systemSettings.ID;
            option.textContent = node.systemSettings.ID;

            if (sourceSelect) sourceSelect.appendChild(option.cloneNode(true));
            if (egpSource) egpSource.appendChild(option.cloneNode(true));
            if (destinationSelect) destinationSelect.appendChild(option.cloneNode(true));
            if (egpDestination) egpDestination.appendChild(option);
        });

        if (sourceSelect) sourceSelect.value = 'UCB-BSM';
        if (destinationSelect) destinationSelect.value = 'LBNL-BSM';
    }

    /** @private */
    _populateBellStateTypeDropdown() {
        const bellStateSelect = document.getElementById('bellState');
        if (!bellStateSelect) return;
        bellStateSelect.innerHTML = '';

        const bellMap = { '00': '00', '01': '01', '10': '10', '11': '11' };

        Object.entries(bellMap).forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            bellStateSelect.appendChild(option);
        });
    }
}
