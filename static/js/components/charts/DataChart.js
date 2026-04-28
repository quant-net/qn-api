/**
 * DataChart — Time-series scatter chart for experiment data.
 *
 * Replaces the global `initializeDataChart()` and `updateDataChart()`
 * from qndata.js.
 *
 * @example
 *   const dataChart = new DataChart('data-chart');
 *   dataChart.initialize();
 *   dataChart.update();
 */
export class DataChart {
    /**
     * @param {string} canvasId - Canvas element ID for the chart
     */
    constructor(canvasId) {
        this._canvasId = canvasId;
        this._chart = null;
        this._timeSeriesData = [];
        this._timeWindow = 5 * 60 * 1000; // 5 minutes in milliseconds
    }

    /** Initialize the Chart.js scatter instance. */
    initialize() {
        if (this._chart) return;
        const ctx = document.getElementById(this._canvasId)?.getContext('2d');
        if (!ctx) return;
        this._chart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Experiment Data',
                    data: this._timeSeriesData,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    pointRadius: 3
                }]
            },
            options: {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'minute',
                            tooltipFormat: 'HH:mm:ss'
                        },
                        title: { display: true, text: 'Time' }
                    },
                    y: {
                        title: { display: true, text: 'Value' }
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

    /** Add a random data point and refresh the chart. */
    update() {
        if (!this._chart) return;
        const newDataPoint = {
            x: new Date(),
            y: Math.floor(Math.random() * 100)
        };
        this._timeSeriesData.push(newDataPoint);
        this._chart.update();
    }
}
