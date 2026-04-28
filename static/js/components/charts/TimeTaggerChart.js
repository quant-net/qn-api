/**
 * TimeTaggerChart — Wavepacket and collection-rate charts for UCB and LBL.
 *
 * Replaces the global `initializeTimeTaggerCharts()` and
 * `updateTimeTaggerCharts()` from qndata.js.
 *
 * @example
 *   const ttChart = new TimeTaggerChart({
 *       wavepacketUCB: 'wavepacketChartUCB',
 *       collectionUCB: 'collectionRateChartUCB',
 *       wavepacketLBL: 'wavepacketChartLBL',
 *       collectionLBL: 'collectionRateChartLBL',
 *       labelUCB: 'photon-count-label-ucb',
 *       labelLBL: 'photon-count-label-lbnl'
 *   });
 *   ttChart.update(msg);
 */
export class TimeTaggerChart {
    /**
     * @param {Object} ids - Canvas and label element IDs
     * @param {string} ids.wavepacketUCB
     * @param {string} ids.collectionUCB
     * @param {string} ids.wavepacketLBL
     * @param {string} ids.collectionLBL
     * @param {string} ids.labelUCB
     * @param {string} ids.labelLBL
     */
    constructor(ids) {
        this._ids = ids;
        this._wavepacketUCB = null;
        this._collectionUCB = null;
        this._wavepacketLBL = null;
        this._collectionLBL = null;

        // Rate constants
        this._totalSpgAttempts = 5e6;
        this._lbnlSpgRate = this._totalSpgAttempts / 30;
        this._ucbSpgRate = this._totalSpgAttempts / 45;
    }

    /** @returns {boolean} Whether all four charts are initialized */
    get initialized() {
        return !!(this._wavepacketUCB && this._collectionUCB &&
                  this._wavepacketLBL && this._collectionLBL);
    }

    /** Lazily initialize all four Chart.js instances. */
    initialize() {
        if (this.initialized) return;

        const wpCtxUCB = document.getElementById(this._ids.wavepacketUCB)?.getContext('2d');
        const crCtxUCB = document.getElementById(this._ids.collectionUCB)?.getContext('2d');
        const wpCtxLBL = document.getElementById(this._ids.wavepacketLBL)?.getContext('2d');
        const crCtxLBL = document.getElementById(this._ids.collectionLBL)?.getContext('2d');

        if (!wpCtxUCB || !crCtxUCB || !wpCtxLBL || !crCtxLBL) return;

        this._wavepacketUCB = this._createWavepacketChart(wpCtxUCB);
        this._collectionUCB = this._createCollectionChart(crCtxUCB);
        this._wavepacketLBL = this._createWavepacketChart(wpCtxLBL);
        this._collectionLBL = this._createCollectionChart(crCtxLBL);
    }

    /**
     * Update charts with new WebSocket data.
     * @param {Object} msg - Message payload with cid and data fields
     */
    update(msg) {
        if (!this.initialized) this.initialize();
        if (!msg.data || !msg.data.meastime) return;

        const data = msg.data;

        if (msg.cid === 'UCB-Q') {
            this._updateSite(data, this._wavepacketUCB, this._collectionUCB,
                this._ids.labelUCB, this._ucbSpgRate);
        } else if (msg.cid === 'LBNL-Q') {
            this._updateSite(data, this._wavepacketLBL, this._collectionLBL,
                this._ids.labelLBL, this._lbnlSpgRate);
        }
    }

    /** @private */
    _updateSite(data, wavepacketChart, collectionChart, labelId, spgRate) {
        if (data.bins) {
            const wavepacketX = data.bins.map(x => parseFloat(x * 1e-6).toFixed(2));
            wavepacketChart.data.labels = wavepacketX;
            wavepacketChart.data.datasets[0].data = data.cdata;
            wavepacketChart.update();
        }

        if (data.time_diffs) {
            const elapsed = data.time_diffs.map(t => t - data.time_diffs[0]);
            const maxPoints = 1000;

            const trimmedTimes = elapsed.length > maxPoints
                ? elapsed.slice(-maxPoints) : elapsed;
            const trimmedTimes2 = trimmedTimes.map(x => parseFloat(x).toFixed(0));
            const trimmedRates = data.countrates.length > maxPoints
                ? data.countrates.slice(-maxPoints) : data.countrates;

            collectionChart.data.labels = trimmedTimes2;
            collectionChart.data.datasets[0].data = trimmedRates;
            collectionChart.update();

            const { avg } = this._computeRateStats(data.countrates, data.time_diffs);

            const label = document.getElementById(labelId);
            if (label) {
                label.textContent =
                    `Mean count rate: ${parseFloat(avg).toFixed(0)} (1/s), ` +
                    `Rep-rate: ${parseFloat(spgRate / 1e3).toFixed(0)} (1/ms), ` +
                    `Efficiency: ${parseFloat((avg / spgRate) * 100).toFixed(2)}% `;
            }
        }
    }

    /**
     * Compute average count rate from countrates and time_diffs arrays.
     * @private
     * @param {number[]} countrates
     * @param {number[]} timeDiffs
     * @returns {{ avg: number, lastPhotonCount: number }}
     */
    _computeRateStats(countrates, timeDiffs) {
        let currentPeriod = [];
        let currentPeriodStartTime = null;
        let currentPeriodEndTime = null;
        let inPeriod = false;
        let zeroCount = 0;
        let lastPhotonCount = 0;
        let avg = 0;

        for (let i = 0; i < countrates.length; i++) {
            const val = countrates[i];
            const t = timeDiffs[i];

            if (val > 0) {
                zeroCount = 0;
                if (!inPeriod) {
                    currentPeriod = [];
                    currentPeriodStartTime = t;
                    inPeriod = true;
                }
                currentPeriod.push({ time: t, value: val });
                currentPeriodEndTime = t;
            } else if (inPeriod) {
                zeroCount++;
                if (zeroCount >= 10) {
                    const duration = currentPeriodEndTime - currentPeriodStartTime;
                    if (currentPeriod.length && duration > 0) {
                        const sum = currentPeriod.reduce((acc, pt) => acc + pt.value, 0);
                        avg = sum / currentPeriod.length;
                        lastPhotonCount = Math.round(avg * duration);
                    }
                    currentPeriod = [];
                    inPeriod = false;
                    zeroCount = 0;
                }
            }
        }

        // Edge case: period still active at end of data
        if (inPeriod && currentPeriod.length > 0 &&
            currentPeriodStartTime !== null && currentPeriodEndTime !== null) {
            const duration = currentPeriodEndTime - currentPeriodStartTime;
            if (duration > 0) {
                const sum = currentPeriod.reduce((acc, pt) => acc + pt.value, 0);
                avg = sum / currentPeriod.length;
                lastPhotonCount = Math.round(avg * duration);
            }
        }

        return { avg, lastPhotonCount };
    }

    /** @private */
    _createWavepacketChart(ctx) {
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Counts',
                    data: [],
                    borderColor: 'blue',
                    backgroundColor: 'rgba(0, 0, 255, 0.1)',
                    pointRadius: 0,
                    tension: 0.1
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                animations: {
                    x: { duration: 1000 },
                    y: { duration: 0 }
                },
                animation: true,
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        display: true,
                        title: { display: true, text: 'Time (μs)' },
                        ticks: { stepSize: 0.25 }
                    },
                    y: { title: { display: true, text: 'Counts' } }
                }
            }
        });
    }

    /** @private */
    _createCollectionChart(ctx) {
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Count Rate',
                    data: [],
                    borderColor: 'red',
                    backgroundColor: 'rgba(255,0,0,0.1)',
                    pointRadius: 2,
                    tension: 0.1
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                animations: {
                    x: { duration: 1000 },
                    y: { duration: 0 }
                },
                animation: false,
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: { display: true, text: 'Elapsed Time (s)' },
                        ticks: { stepSize: 20, beginAtZero: true }
                    },
                    y: { title: { display: true, text: 'Count Rate (1/s)' } }
                }
            }
        });
    }
}
