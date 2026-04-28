/**
 * EventBus — Lightweight pub/sub for cross-component communication.
 *
 * Usage:
 *   const bus = new EventBus();
 *   bus.on('agent:updated', data => console.log(data));
 *   bus.emit('agent:updated', { id: 'LBNL-Q' });
 *   bus.off('agent:updated', handler);
 */
export class EventBus {
    constructor() {
        this._listeners = new Map();
    }

    /**
     * Subscribe to an event.
     * @param {string} event - Event name
     * @param {Function} fn - Callback function
     */
    on(event, fn) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event).push(fn);
    }

    /**
     * Unsubscribe from an event.
     * @param {string} event - Event name
     * @param {Function} fn - The exact callback reference to remove
     */
    off(event, fn) {
        const fns = this._listeners.get(event);
        if (fns) {
            this._listeners.set(event, fns.filter(f => f !== fn));
        }
    }

    /**
     * Emit an event to all subscribers.
     * @param {string} event - Event name
     * @param {*} data - Payload passed to each subscriber
     */
    emit(event, data) {
        const fns = this._listeners.get(event) || [];
        for (const fn of fns) {
            try {
                fn(data);
            } catch (err) {
                console.error(`EventBus error in handler for "${event}":`, err);
            }
        }
    }

    /**
     * Subscribe to an event, but auto-unsubscribe after the first call.
     * @param {string} event - Event name
     * @param {Function} fn - Callback function
     */
    once(event, fn) {
        const wrapper = (data) => {
            this.off(event, wrapper);
            fn(data);
        };
        this.on(event, wrapper);
    }
}
