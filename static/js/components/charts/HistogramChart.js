/**
 * HistogramChart — Normal-distribution histogram chart component.
 *
 * Replaces the global `initializeHistogramChart()`, `updateHistogram()`,
 * and `sampleNormalDistribution()` from qndata.js.
 *
 * @example
 *   const histogram = new HistogramChart('data-chart');
 *   histogram.initialize();
 *   histogram.startUpdating();
 */
export class HistogramChart {
    /**
     * @param {string} canvasId - Canvas element ID for the chart
     */
    constructor(canvasId) {
        this._canvasId = canvasId;
        this._chart = null;
        this._updateInterval = null;
        this._startTime = null;
        this._timeWindow = 5 * 60 * 1000; // 5 minutes

        // Histogram configuration
        this._numBins = 30;
        this._binWidth = 1;
        this._minRange = -5;
        this._maxRange = 5;
        this._histogramData = Array(10).fill(0);
        this._binLabels = Array.from({ length: this._numBins }, (_, i) => {
            const start = this._minRange + i * this._binWidth;
            const end = start + this._binWidth;
            return `${start.toFixed(1)} - ${end.toFixed(1)}`;
        });
    }

    /** Initialize the Chart.js bar instance. */
    initialize() {
        if (this._chart) return;
        const ctx = document.getElementById(this._canvasId)?.getContext('2d');
        if (!ctx) return;
        this._chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this._binLabels,
                datasets: [{
                    label: 'Frequency',
                    data: this._histogramData,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    x: {
                        title: { display: true, text: 'Value' }
                    },
                    y: {
                        title: { display: true, text: 'Frequency' },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: { display: true, position: 'top' }
                },
                adapters: {
                    date: { locale: 'enUS' }
                }
            }
        });
    }

    /**
     * Sample from a normal distribution using the Box-Muller transform.
     * @returns {number}
     */
    sampleNormal() {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    /** Add one sample to the histogram and refresh the chart. */
    update() {
        if (!this._chart || !this._startTime) return;

        const elapsed = new Date().getTime() - this._startTime;
        if (elapsed >= this._timeWindow) {
            this.stopUpdating();
            console.log('Histogram updates stopped after 5 minutes.');
            return;
        }

        const sample = this.sampleNormal();
        const binIndex = Math.floor((sample - this._minRange) / this._binWidth);
        if (binIndex >= 0 && binIndex < this._numBins) {
            this._histogramData[binIndex]++;
        }
        this._chart.update();
    }

    /** Start periodic histogram updates. */
    startUpdating() {
        this._startTime = new Date().getTime();
        this._updateInterval = setInterval(() => this.update(), 100);
    }

    /** Stop periodic histogram updates. */
    stopUpdating() {
        if (this._updateInterval) {
            clearInterval(this._updateInterval);
            this._updateInterval = null;
        }
    }
}
