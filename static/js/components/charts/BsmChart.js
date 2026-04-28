/**
 * BsmChart — BSM tracking scatter chart component.
 *
 * Replaces the global `initializeBsmChart()` and `updateBsmChart()`
 * from qndata.js.
 *
 * @example
 *   const bsmChart = new BsmChart('bsm-chart');
 *   bsmChart.update(data);
 */
export class BsmChart {
    /**
     * @param {string} canvasId - Canvas element ID for the chart
     */
    constructor(canvasId) {
        this._canvasId = canvasId;
        this._chart = null;
        this._lastTime = 0;
        this._data = {
            labels: [],
            datasets: [
                {
                    label: 'ψ+',
                    borderColor: 'blue',
                    backgroundColor: 'rgba(0, 0, 255, 0.2)',
                    data: []
                },
                {
                    label: 'ψ-',
                    borderColor: 'red',
                    backgroundColor: 'rgba(255, 0, 0, 0.2)',
                    data: []
                }
            ]
        };
        this._yAxisPlugin = {
            id: 'bsmYAxisLabel',
            afterDraw: (chart) => {
                const ctx = chart.ctx;
                const yAxis = chart.scales.y;
                if (!yAxis) return;
                ctx.save();
                ctx.font = 'bold 12px sans-serif';
                ctx.fillStyle = 'black';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                const x = yAxis.left + (yAxis.width / 2);
                const y = yAxis.top - 10;
                ctx.fillText('1e3', x + 20, y);
                ctx.restore();
            }
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
                animations: {
                    x: { duration: 1000 },
                    y: { duration: 0 }
                },
                animation: true,
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: { display: true, text: 'Time (s)' },
                        ticks: { stepSize: 500 }
                    },
                    y: {
                        title: { display: true, text: 'Coin Counts rate (1/s)' }
                    }
                },
                elements: {
                    line: { tension: 0 },
                    point: { radius: 3 }
                }
            },
            plugins: [this._yAxisPlugin]
        });
    }

    /**
     * Update the chart with new WebSocket data.
     * @param {Object} data - Message payload with data.bsm_tracking array
     */
    update(data) {
        if (!this._chart) this.initialize();
        if (!data.data || !data.data.bsm_tracking) return;

        data.data.bsm_tracking.forEach(entry => {
            const time = Math.round(entry[0]);
            const psiPlus = parseFloat(entry[1] / 1e3).toFixed(2);
            const psiMinus = parseFloat(entry[2] / 1e3).toFixed(2);

            if (time < this._lastTime) {
                this._data.labels = [];
                this._data.datasets[0].data = [];
                this._data.datasets[1].data = [];
            }

            this._data.labels.push(time);
            this._data.datasets[0].data.push(psiPlus);
            this._data.datasets[1].data.push(psiMinus);
            this._lastTime = time;

            // Extract the last visibility value and display it
            const visElement = document.getElementById('bsm-visibility-value');
            if (visElement) {
                visElement.textContent = `Visibility: ${entry[3].toFixed(3)}`;
            }
        });

        this._chart.update();
    }
}
