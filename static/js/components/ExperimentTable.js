/**
 * ExperimentTable — Encapsulates experiment table rendering.
 *
 * Replaces the global `populateExperimentTable()` from qn.js.
 *
 * Usage:
 *   const expTable = new ExperimentTable('exp-table-body', {
 *       cardSelector: '#exp-card',
 *       onOpenModal: (experiment) => openExperimentModal(experiment)
 *   });
 *   expTable.render(experiments, sortDescending);
 */
export class ExperimentTable {
    /**
     * @param {string} tableBodyId - ID of the <tbody> element
     * @param {Object} [options]
     * @param {string} [options.cardSelector='#exp-card'] - Selector for the card wrapper (highlight animation)
     * @param {Function} [options.onOpenModal] - Callback when info icon is clicked
     */
    constructor(tableBodyId, options = {}) {
        this._tableBodyId = tableBodyId;
        this._cardSelector = options.cardSelector || '#exp-card';
        this._onOpenModal = options.onOpenModal || null;
    }

    /**
     * Render the full experiment table.
     * @param {Array} experiments - Array of experiment objects
     * @param {boolean} sortDescending - Sort by created_at descending
     */
    render(experiments, sortDescending) {
        const tableBody = document.getElementById(this._tableBodyId);
        if (!tableBody) return;
        tableBody.innerHTML = '';

        experiments.sort((a, b) => {
            return sortDescending
                ? b.created_at - a.created_at
                : a.created_at - b.created_at;
        });

        experiments.forEach(experiment => {
            if (!experiment.id) return;
            if (experiment.type !== 'experiment') return;

            const expname = experiment.parameters.exp_name;
            const resources = experiment.parameters.path;
            const startTime = new Date(experiment.created_at * 1000).toLocaleString();

            // Determine status display
            const statusValue = experiment.status?.value || experiment.phase || 'Unknown';
            const isFailed = experiment.status?.code !== 0 && experiment.status?.code !== undefined;
            const statusClass = isFailed ? 'text-danger fw-bold' : '';

            // Create Table Row
            const row = document.createElement('tr');
            if (isFailed) row.classList.add('table-danger');
            row.innerHTML = `
                <td>${experiment.id.slice(-8)}</td>
                <td>${expname || 'N/A'}</td>
                <td>${startTime}</td>
                <td>${resources}</td>
                <td class="${statusClass}">${statusValue}</td>
                <td class="text-center">
                    <div class="d-flex justify-content-center align-items-center">
                        <span class="info-icon" style="cursor:pointer;">
                            ℹ️
                        </span>
                    </div>
                </td>
            `;

            // Assign the onclick function to open the modal
            if (this._onOpenModal) {
                const openModal = this._onOpenModal;
                row.querySelector('.info-icon').onclick = function () {
                    openModal(experiment);
                };
            }

            tableBody.appendChild(row);
        });

        this._highlightCard();
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
