/**
 * HomChart — HOM (Hong-Ou-Mandel) coincidence line chart component.
 *
 * Replaces the global `initializeHOMChart()` and `updateHomChart()`
 * from qndata.js.
 *
 * @example
 *   const homChart = new HomChart('hom-chart');
 *   homChart.update(msg);
 */
export class HomChart {
    /**
     * @param {string} canvasId - Canvas element ID for the chart
     */
    constructor(canvasId) {
        this._canvasId = canvasId;
        this._chart = null;
        this._lastDelay = 0;
        this._data = {
            labels: [],
            datasets: [{
                label: 'HOM Coincidence',
                data: [],
                borderColor: 'teal',
                backgroundColor: 'rgba(0,128,128,0.3)',
                pointRadius: 3,
                tension: 0.2
            }]
        };
    }

    /** Lazily initialize the Chart.js instance. */
    initialize() {
        if (this._chart) return;
        const ctx = document.getElementById(this._canvasId)?.getContext('2d');
        if (!ctx) return;
        this._chart = new Chart(ctx, {
            type: 'line',
            data: this._data,
            options: {
                animations: {
                    x: { duration: 1000 },
                    y: { duration: 0 }
                },
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: { display: true, text: 'Time (us)' }
                    },
                    y: {
                        title: { display: true, text: 'Coin count' }
                    }
                }
            }
        });
    }

    /**
     * Update the chart with new WebSocket data.
     * @param {Object} msg - Message payload with data.HOM object
     */
    update(msg) {
        const HOM = msg.data?.HOM;
        if (!HOM || typeof HOM.delay !== 'number' ||
            typeof HOM.coincidence !== 'number') return;

        if (!this._chart) this.initialize();

        if (HOM.delay < this._lastDelay) {
            this._chart.data.labels = [];
            this._chart.data.datasets[0].data = [];
        }

        const delayUs = HOM.delay / 1000;
        this._chart.data.labels.push(delayUs);
        this._chart.data.datasets[0].data.push(HOM.coincidence);

        if (this._chart.data.labels.length > 200) {
            this._chart.data.labels.shift();
            this._chart.data.datasets[0].data.shift();
        }

        this._lastDelay = HOM.delay;
        this._chart.update();
    }
}
