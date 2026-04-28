/**
 * PolTrackingChart — Polarization tracking scatter chart component.
 *
 * Replaces the global `initializePolTrackingChart()`, `updatePolChart()`,
 * and `openPolChartModal()` from qndata.js.
 *
 * @example
 *   const polChart = new PolTrackingChart('pol-chart', 'polChartModal');
 *   polChart.update(msg);
 *   polChart.openModal();
 */
export class PolTrackingChart {
    /**
     * @param {string} canvasId - Canvas element ID for the chart
     * @param {string} modalId  - Modal element ID for the enlarged view
     */
    constructor(canvasId, modalId) {
        this._canvasId = canvasId;
        this._modalId = modalId;
        this._chart = null;
        this._data = {
            datasets: [
                { label: 'Bob_H1', data: [], borderColor: 'blue', backgroundColor: 'blue', showLine: false },
                { label: 'Bob_D2', data: [], borderColor: 'red', backgroundColor: 'red', showLine: false },
                { label: 'Bob_H2', data: [], borderColor: 'green', backgroundColor: 'green', showLine: false },
                { label: 'Alice_H1', data: [], borderColor: 'black', backgroundColor: 'black', showLine: false },
                { label: 'Alice_D2', data: [], borderColor: 'navy', backgroundColor: 'navy', showLine: false },
                { label: 'Alice_H2', data: [], borderColor: 'orange', backgroundColor: 'orange', showLine: false }
            ]
        };
    }

    /** Lazily initialize the Chart.js instance. */
    initialize() {
        if (this._chart) return;
        const ctx = document.getElementById(this._canvasId)?.getContext('2d');
        if (!ctx) return;
        this._chart = new Chart(ctx, {
            type: 'scatter',
            data: this._data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    annotation: {
                        annotations: {
                            errorThreshold: {
                                type: 'line',
                                yMin: 0.1,
                                yMax: 0.1,
                                borderColor: 'red',
                                borderWidth: 1,
                                borderDash: [6, 6]
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Time (s)' },
                        ticks: {
                            callback: function (value) {
                                const date = new Date(value * 1000);
                                return date.toLocaleTimeString([], { hour12: false });
                            }
                        }
                    },
                    y: {
                        title: { display: true, text: 'Error' },
                        max: 0.2
                    }
                }
            }
        });
    }

    /**
     * Update the chart with new WebSocket data.
     * @param {Object} msg - Message payload with data.pol_tracking object
     */
    update(msg) {
        if (!this._chart) this.initialize();
        if (!msg?.ts || !msg.data?.pol_tracking) return;

        const timestamp = msg.ts;
        const entries = Object.entries(msg.data.pol_tracking);

        for (const [label, value] of entries) {
            const dataset = this._chart.data.datasets.find(d => d.label === label);
            if (dataset) {
                dataset.data.push({ x: timestamp, y: value });
                if (dataset.data.length > 200) {
                    dataset.data.shift();
                }
            }
        }

        this._chart.update();
    }

    /** Open the polarization chart in a Bootstrap modal. */
    openModal() {
        if (!this._chart) this.initialize();
        new bootstrap.Modal(document.getElementById(this._modalId)).show();
    }
}
