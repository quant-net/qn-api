/**
 * ExperimentStore — centralised state for experiment data.
 *
 * Encapsulates the experiment-related parts of the old `obj` global:
 *   - `obj.experiments`    (experiment list)
 *   - `obj.cal_type_map`   (calibration type label map)
 *   - `obj.request_types`  (known request type strings)
 *   - `obj.topology`       (network topology data)
 *   - `obj.ws_host / ws_port` (MQTT connection params)
 *
 * Usage:
 *   const experimentStore = new ExperimentStore(eventBus);
 *   experimentStore.loadFromServer(obj);
 *   experimentStore.getExperiments();
 */
export class ExperimentStore {
    /**
     * @param {EventBus} eventBus
     */
    constructor(eventBus) {
        /** @type {EventBus} */
        this.eventBus = eventBus;

        /**
         * Array of experiment objects.
         * @type {Array}
         */
        this._experiments = [];

        /**
         * Calibration type label map (e.g. { 1: "Frequency", 2: "Power" }).
         * @type {Object<number, string>}
         */
        this._calTypeMap = {};

        /**
         * Known request type strings for matching MQTT messages.
         * @type {Array<string>}
         */
        this._requestTypes = [];

        /**
         * Network topology data for vis.js rendering.
         * @type {Object|null}
         */
        this._topology = null;

        /**
         * MQTT WebSocket host.
         * @type {string}
         */
        this._wsHost = '';

        /**
         * MQTT WebSocket port.
         * @type {number}
         */
        this._wsPort = 0;

        /**
         * Sort flags for UI tables.
         * @type {{ experiments: boolean, calibrations: boolean }}
         */
        this.sortDescending = {
            experiments: true,
            calibrations: true
        };
    }

    /* ------------------------------------------------------------------ */
    /*  Hydration                                                         */
    /* ------------------------------------------------------------------ */

    /**
     * Populate the store from the initial server payload (the Jinja `data` object).
     * @param {Object} serverData — the full `{{ data | tojson }}` object
     */
    loadFromServer(serverData) {
        this._experiments = serverData.experiments || [];
        this._calTypeMap = serverData.cal_type_map || {};
        this._requestTypes = serverData.request_types || [];
        this._topology = serverData.topology || null;
        this._wsHost = serverData.ws_host || '';
        this._wsPort = serverData.ws_port || 0;
    }

    /* ------------------------------------------------------------------ */
    /*  Experiments                                                       */
    /* ------------------------------------------------------------------ */

    /**
     * Get all experiments.
     * @returns {Array}
     */
    getExperiments() {
        return this._experiments;
    }

    /**
     * Add experiments (e.g. from an MQTT-triggered REST fetch).
     * @param {Array} newExperiments
     */
    addExperiments(newExperiments) {
        this._experiments = this._experiments.concat(newExperiments);
        this.eventBus.emit('experiment:added', { experiments: newExperiments });
    }

    /* ------------------------------------------------------------------ */
    /*  Lookup Data                                                       */
    /* ------------------------------------------------------------------ */

    /**
     * Get the calibration type label map.
     * @returns {Object<number, string>}
     */
    getCalTypeMap() {
        return this._calTypeMap;
    }

    /**
     * Get the known request types array.
     * @returns {Array<string>}
     */
    getRequestTypes() {
        return this._requestTypes;
    }

    /**
     * Get the topology data for vis.js.
     * @returns {Object|null}
     */
    getTopology() {
        return this._topology;
    }

    /**
     * Get the MQTT WebSocket host.
     * @returns {string}
     */
    getWsHost() {
        return this._wsHost;
    }

    /**
     * Get the MQTT WebSocket port.
     * @returns {number}
     */
    getWsPort() {
        return this._wsPort;
    }

    /**
     * Check if a request type is known.
     * @param {string} rtype
     * @returns {boolean}
     */
    isKnownRequestType(rtype) {
        return this._requestTypes.indexOf(rtype) >= 0;
    }
}
