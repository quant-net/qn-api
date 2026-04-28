/**
 * DebugPanel — Encapsulates the debug message log with scrollback limit.
 *
 * Replaces the global `addDebugMessage()`, `debugMessages[]`, and
 * `maxDebugMessages` from qn.js.
 *
 * Usage:
 *   const debugPanel = new DebugPanel('debug-panel', { maxMessages: 1000 });
 *   debugPanel.addMessage('Hello world');
 */
export class DebugPanel {
    /**
     * @param {string} panelId - ID of the <textarea> element
     * @param {Object} [options]
     * @param {number} [options.maxMessages=1000] - Maximum lines to retain
     */
    constructor(panelId, options = {}) {
        this._panelId = panelId;
        this._maxMessages = options.maxMessages || 1000;
        this._messages = [];
    }

    /**
     * Append a message to the debug panel with scrollback limit.
     * @param {string} message
     */
    addMessage(message) {
        const panel = document.getElementById(this._panelId);
        if (!panel) return;

        this._messages.push(message);

        // Trim messages if exceeding limit
        if (this._messages.length > this._maxMessages) {
            this._messages.shift();
        }

        // Update the textarea content
        panel.value = this._messages.join('\n');

        // Check if the user has scrolled up
        const shouldScroll = panel.scrollHeight - panel.scrollTop < 2 * panel.clientHeight;

        // Auto-scroll only if the user is at the bottom
        if (shouldScroll) {
            panel.scrollTop = panel.scrollHeight;
        }
    }
}
