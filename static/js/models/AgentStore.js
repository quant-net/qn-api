import { stateToIconColor } from '../utils/formatters.js';

/**
 * AgentStore — centralised state for network agents.
 *
 * Encapsulates the old global `nodes` object and all heartbeat /
 * last-seen / state-tracking logic that was previously scattered
 * across main.html inline script and qn.js.
 *
 * Usage:
 *   const agentStore = new AgentStore(eventBus);
 *   agentStore.loadFromServer(obj.nodes);   // initial hydration
 *   agentStore.get('LBNL-Q');               // → { value, lastSeen, iconColor, state, … }
 */
export class AgentStore {
    /**
     * @param {EventBus} eventBus
     */
    constructor(eventBus) {
        /** @type {EventBus} */
        this.eventBus = eventBus;

        /**
         * Keyed by agent ID (systemSettings.ID).
         * Each value: { value: <raw agent obj>, lastSeen: number|'never',
         *               iconColor: string, state: string, lastState: string }
         * @type {Object<string, Object>}
         */
        this._agents = {};
    }

    /* ------------------------------------------------------------------ */
    /*  Hydration                                                         */
    /* ------------------------------------------------------------------ */

    /**
     * Populate the store from the initial server payload (obj.nodes).
     * Replaces the old `obj.nodes.forEach(…)` block in main.html.
     *
     * @param {Array} nodeList — array of raw agent objects from the API
     */
    loadFromServer(nodeList) {
        nodeList.forEach(n => {
            if (!n.state) n.state = {};
            this._agents[n.systemSettings.ID] = {
                value: n,
                lastSeen: 'never',
                iconColor: stateToIconColor(n.state),
                state: n.state.value || 'unknown'
            };
        });
    }

    /* ------------------------------------------------------------------ */
    /*  Accessors                                                         */
    /* ------------------------------------------------------------------ */

    /**
     * Get a single agent entry by ID.
     * @param {string} id
     * @returns {Object|undefined}
     */
    get(id) {
        return this._agents[id];
    }

    /**
     * Return the full agents dictionary (for iteration / legacy compat).
     * @returns {Object<string, Object>}
     */
    getAll() {
        return this._agents;
    }

    /**
     * Check whether an agent exists.
     * @param {string} id
     * @returns {boolean}
     */
    has(id) {
        return id in this._agents;
    }

    /**
     * Return sorted array of agent IDs.
     * @returns {string[]}
     */
    sortedIds() {
        return Object.keys(this._agents).sort((a, b) => a.localeCompare(b));
    }

    /**
     * Return the raw node list (array of agent.value objects).
     * Useful for populating dropdowns that expect the original array format.
     * @returns {Array}
     */
    nodeList() {
        return Object.values(this._agents).map(a => a.value);
    }

    /* ------------------------------------------------------------------ */
    /*  Mutations                                                         */
    /* ------------------------------------------------------------------ */

    /**
     * Handle an agent heartbeat — reset lastSeen to 0.
     * @param {string} id
     */
    heartbeat(id) {
        const agent = this._agents[id];
        if (!agent) return;
        agent.lastSeen = 0;
        this.eventBus.emit('agent:heartbeat', { id });
    }

    /**
     * Handle an agent state change event.
     * @param {string} id
     * @param {Object} stateData — the raw MQTT data (has .value property)
     */
    updateState(id, stateData) {
        const agent = this._agents[id];
        if (!agent) return;
        agent.iconColor = stateToIconColor(stateData);
        agent.lastSeen = 0;
        agent.state = stateData.value;
        this.eventBus.emit('agent:stateChanged', { id, state: stateData });
    }

    /**
     * Increment "Last Seen" counter for every agent (called on 1s interval).
     * Also handles dead-agent detection and state transitions.
     */
    incrementLastSeen() {
        Object.keys(this._agents).forEach(id => {
            const agent = this._agents[id];
            if (agent.lastSeen === 'never') {
                return; // skip agents that have never been seen
            }
            if (typeof agent.lastSeen === 'number') {
                agent.lastSeen += 1;
            }
        });
        this.eventBus.emit('agent:lastSeenTick', { agents: this._agents });
    }
}
