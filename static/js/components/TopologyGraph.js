/**
 * TopologyGraph — Encapsulates vis.js network graph rendering and interaction.
 *
 * Replaces the inline `drawTopology()` function and the `network`, `topo_nodes`,
 * `topo_edges` globals from main.html.
 *
 * Usage:
 *   const topology = new TopologyGraph('topology-container', {
 *       onDoubleClick: (nodeId) => openAgentModalFromTopology(nodeId)
 *   });
 *   topology.draw(experimentStore.getTopology());
 *   // AgentTable can reference: topology.getNodes()
 */
export class TopologyGraph {
    /**
     * @param {string} containerId - ID of the DOM element for the vis.js graph
     * @param {Object} [options]
     * @param {Function} [options.onDoubleClick] - Callback when a node is double-clicked, receives nodeId
     * @param {Object} [options.networkOptions] - vis.js Network options override
     */
    constructor(containerId, options = {}) {
        this._containerId = containerId;
        this._onDoubleClick = options.onDoubleClick || null;
        this._networkOptions = options.networkOptions || {
            physics: { enabled: true },
            edges: { arrows: 'to' }
        };

        /** @type {vis.Network|null} */
        this._network = null;
        /** @type {vis.DataSet|null} */
        this._nodes = null;
        /** @type {vis.DataSet|null} */
        this._edges = null;
    }

    /**
     * Draw (or redraw) the topology graph.
     * @param {Object} topo - Topology data with `nodes` and `edges` arrays
     */
    draw(topo) {
        const container = document.getElementById(this._containerId);
        if (!container) {
            console.warn(`TopologyGraph: container #${this._containerId} not found`);
            return;
        }

        console.log('Embedded Data:', topo);

        this._nodes = new vis.DataSet(topo.nodes || []);
        this._edges = new vis.DataSet(topo.edges || []);

        this._network = new vis.Network(
            container,
            { nodes: this._nodes, edges: this._edges },
            this._networkOptions
        );

        // Double-click opens agent modal
        if (this._onDoubleClick) {
            this._network.on('doubleClick', (params) => {
                if (params.nodes.length > 0) {
                    this._onDoubleClick(params.nodes[0]);
                }
            });
        }
    }

    /**
     * Get the vis.js DataSet of nodes (used by AgentTable for highlighting).
     * @returns {vis.DataSet|null}
     */
    getNodes() {
        return this._nodes;
    }

    /**
     * Get the vis.js DataSet of edges.
     * @returns {vis.DataSet|null}
     */
    getEdges() {
        return this._edges;
    }

    /**
     * Get the vis.js Network instance.
     * @returns {vis.Network|null}
     */
    getNetwork() {
        return this._network;
    }
}
