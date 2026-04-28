import { phaseToColorClass } from '../utils/formatters.js';

/**
 * CalibrationTable — Encapsulates calibration table rendering and row updates.
 *
 * Replaces the global `populateCalibrationTable()` and `updateCalibrationRow()`
 * from qn.js.
 *
 * Usage:
 *   const calTable = new CalibrationTable('calibration-table-body', {
 *       cardSelector: '#cal-card',
 *       onOpenModal: (calib) => openCalibrationModal(calib),
 *       onOpenChart: () => openPolChartModal()
 *   });
 *   calTable.render(calibrations, sortDescending, calTypeMap);
 *   calTable.updateRow(message);
 */
export class CalibrationTable {
    /**
     * @param {string} tableBodyId - ID of the <tbody> element
     * @param {Object} [options]
     * @param {string} [options.cardSelector='#cal-card'] - Selector for the card wrapper (highlight animation)
     * @param {Function} [options.onOpenModal] - Callback when info icon is clicked
     * @param {Function} [options.onOpenChart] - Callback when chart icon is clicked
     * @param {Object} [options.calibrations] - Reference to the calibrations store object (for merge on updateRow)
     */
    constructor(tableBodyId, options = {}) {
        this._tableBodyId = tableBodyId;
        this._cardSelector = options.cardSelector || '#cal-card';
        this._onOpenModal = options.onOpenModal || null;
        this._onOpenChart = options.onOpenChart || null;
        this._calibrations = options.calibrations || null;
    }

    /**
     * Render the full calibration table.
     * @param {Object|Array} calibrations - Calibrations map or array
     * @param {boolean} sortDescending - Sort by created_at descending
     * @param {Object} calTypeMap - Map of calibration type IDs to labels
     */
    render(calibrations, sortDescending, calTypeMap) {
        const tableBody = document.getElementById(this._tableBodyId);
        if (!tableBody) return;
        tableBody.innerHTML = '';

        const calArray = Array.isArray(calibrations)
            ? calibrations
            : Object.values(calibrations);

        calArray.sort((a, b) => {
            return sortDescending
                ? b.created_at - a.created_at
                : a.created_at - b.created_at;
        });

        calArray.forEach(calib => {
            // Format ID as Last 8 Characters
            const formattedID = calib.id.slice(-8);

            // Format Start Time as Human-Readable Date
            const startTime = new Date(calib.created_at * 1000).toLocaleString();

            // Extract exp_params with fallback
            const expParams = calib.parameters?.exp_params || {};

            // Map Calibration Type (check nested first, then direct)
            const calibTypeId = expParams.type ?? calib.type;
            const calibType = (calTypeMap && calTypeMap[calibTypeId]) || 'Unknown Type';

            // Extract src/dst with fallback
            const src = expParams.src || calib.src || 'N/A';
            const dst = expParams.dst || calib.dst || 'N/A';

            // Build dynamic parameters string from exp_params
            const paramsArray = ['err_thresh: 0.1', 'mean_photon_num: 5'];
            if (expParams.power !== undefined) {
                paramsArray.push(`power: ${expParams.power}`);
            }
            if (expParams.cal_light !== undefined) {
                paramsArray.push(`cal_light: ${expParams.cal_light}`);
            }
            const parameters = paramsArray.length > 0 ? paramsArray.join(', ') : 'N/A';

            // Create Table Row
            const row = document.createElement('tr');
            row.id = `calib-${calib.id}`;
            const phase = calib.status?.value || calib.phase;
            row.innerHTML = `
                <td>${formattedID}</td>
                <td>${calibType}</td>
                <td>${startTime}</td>
                <td>${src}</td>
                <td>${dst}</td>
                <td>${parameters}</td>
                <td class="status-cell ${phaseToColorClass(phase)}">${phase}</td>
                <td class="text-center">
                    <img src="static/images/chart.png" alt="Chart" style="cursor: pointer; width: 35px;" class="cal-chart-icon">
                </td>
                <td class="text-center">
                    <div class="d-flex justify-content-center align-items-center">
                        <span class="cal-info-icon" style="cursor:pointer;">
                            ℹ️
                        </span>
                    </div>
                </td>
            `;

            // Assign chart icon click
            if (this._onOpenChart) {
                const openChart = this._onOpenChart;
                row.querySelector('.cal-chart-icon').onclick = function () {
                    openChart();
                };
            }

            // Assign info icon click
            if (this._onOpenModal) {
                const openModal = this._onOpenModal;
                row.querySelector('.cal-info-icon').onclick = function () {
                    openModal(calib);
                };
            }

            tableBody.appendChild(row);
        });

        this._highlightCard();
    }

    /**
     * Efficiently update a single calibration row's status.
     * Supports both normalized (status.value) and legacy (phase) formats.
     * @param {Object} message - Calibration update message with id and status/phase
     */
    updateRow(message) {
        const calId = message.id;
        if (!calId) return;

        // Resolve the display status from normalized or legacy format
        const phase = message.status?.value || message.phase;
        if (!phase) return;

        const row = document.getElementById(`calib-${calId}`);
        if (row) {
            const statusCell = row.querySelector('.status-cell');
            statusCell.textContent = phase;

            // Apply the corresponding color class (via utils/formatters.js)
            statusCell.className = statusCell.className.replace(/\btext-\w+/g, '');
            const phaseClass = phaseToColorClass(phase);
            if (phaseClass) {
                statusCell.classList.add(phaseClass);
            }
        }

        // Update the calibration in the store with the full message data
        if (this._calibrations && this._calibrations[calId]) {
            Object.assign(this._calibrations[calId], message);
        }
    }

    /**
     * Flash the card header to indicate an update.
     */
    _highlightCard() {
        const header = document.querySelector(`${this._cardSelector} .card-header`);
        if (!header) return;
        header.classList.add('table-update-highlight');
        setTimeout(() => {
            header.classList.remove('table-update-highlight');
        }, 1000);
    }
}
