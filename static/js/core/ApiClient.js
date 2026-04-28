/**
 * ApiClient — Centralized REST API wrapper.
 *
 * Encapsulates all fetch() calls to the backend API.
 * Each method returns a Promise resolving to the parsed JSON response.
 *
 * Usage:
 *   const api = new ApiClient('api');
 *   const tasks = await api.getTasks('LBNL-Q');
 */
export class ApiClient {
    /**
     * @param {string} baseUrl - API base path (e.g. 'api')
     */
    constructor(baseUrl = 'api') {
        this.baseUrl = baseUrl;
    }

    /**
     * Internal helper for GET requests.
     * @param {string} path - Relative path after baseUrl
     * @param {Object} [params] - Query parameters as key-value pairs
     * @returns {Promise<*>}
     */
    async _get(path, params = {}) {
        const url = new URL(`${this.baseUrl}/${path}`, window.location.origin);
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) {
                url.searchParams.append(k, v);
            }
        });
        const response = await fetch(url.toString());
        if (!response.ok) {
            let message = `GET ${path} failed: ${response.status}`;
            try {
                const body = await response.json();
                message = body.detail || body.error || message;
            } catch (_) { /* ignore parse errors */ }
            throw new Error(message);
        }
        return response.json();
    }

    /**
     * Internal helper for POST requests.
     * @param {string} path - Relative path after baseUrl
     * @param {Object} [params] - Query parameters as key-value pairs
     * @param {Object} [body] - JSON body (optional)
     * @returns {Promise<*>}
     */
    async _post(path, params = {}, body = null) {
        const url = new URL(`${this.baseUrl}/${path}`, window.location.origin);
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) {
                if (Array.isArray(v)) {
                    v.forEach(item => url.searchParams.append(k, item));
                } else {
                    url.searchParams.append(k, v);
                }
            }
        });
        const options = { method: 'POST' };
        if (body) {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(body);
        }
        const response = await fetch(url.toString(), options);
        if (!response.ok) {
            let message = `POST ${path} failed: ${response.status}`;
            try {
                const errBody = await response.json();
                message = errBody.detail || errBody.error || message;
            } catch (_) { /* ignore parse errors */ }
            throw new Error(message);
        }
        return response.json();
    }

    // ── Tasks ──────────────────────────────────────────────

    /**
     * Get agent task results (calibrations).
     * @param {string} agentId - Agent ID to filter by
     * @returns {Promise<Array>}
     */
    getTasks(agentId) {
        return this._get('tasks', { agent_id: agentId });
    }

    // ── Experiments ────────────────────────────────────────

    /**
     * Get experiments, optionally filtered.
     * @param {Object} [opts]
     * @param {string} [opts.expId] - Specific experiment ID
     * @param {boolean} [opts.request] - Return original request data
     * @param {boolean} [opts.last] - Return only the latest
     * @param {string} [opts.agentId] - Filter by agent
     * @returns {Promise<Array>}
     */
    getExperiments({ expId, request, last, agentId } = {}) {
        const path = expId ? `experiments/${expId}` : 'experiments';
        return this._get(path, { request, last, agent_id: agentId });
    }

    // ── Calibrations ──────────────────────────────────────

    /**
     * Get calibration records.
     * @param {Object} [opts]
     * @param {string} [opts.calId] - Specific calibration ID
     * @param {boolean} [opts.last] - Return only the latest
     * @returns {Promise<Array>}
     */
    getCalibrations({ calId, last } = {}) {
        const path = calId ? `calibration/${calId}` : 'calibration';
        return this._get(path, { last });
    }

    /**
     * Submit a calibration request.
     * @param {Object} params - { type, src, dst, power, light }
     * @returns {Promise<Object>}
     */
    postCalibration({ type, src, dst, power, light }) {
        return this._post('calibrate', { type, src, dst, power, light });
    }

    // ── Ping ──────────────────────────────────────────────

    /**
     * Send ping requests to remote agents.
     * @param {string[]} remotes - List of agent IDs
     * @param {number} iterations - Number of ping iterations
     * @returns {Promise<Object>}
     */
    postPing(remotes, iterations) {
        return this._post('pingpong', { remotes, iterations });
    }

    // ── Single Photon Generation / BSM ────────────────────

    /**
     * Submit a single photon generation or BSM request.
     * @param {string} endpoint - 'spg' or 'bsm'
     * @param {string[]} src - Source agent IDs
     * @param {number} rate - Rate in Hz
     * @param {number} duration - Duration in seconds
     * @returns {Promise<Object>}
     */
    postSpg(endpoint, { src, rate, duration }) {
        return this._post(endpoint, { src, rate, duration });
    }

    // ── Entanglement Generation ───────────────────────────

    /**
     * Submit an entanglement generation request.
     * @param {Object} params - { src, dst, pairs, bellState, fidelity }
     * @returns {Promise<Object>}
     */
    postEgp({ src, dst, pairs, bellState, fidelity }) {
        return this._post('egp', { src, dst, pairs, bellState, fidelity });
    }
}
