/**
 * Game FreeWorld - EventBus (v5.0)
 * Decoupled event system for modular AAA architecture with contract validation & telemetry
 */
import { eventValidator } from './EventValidator.js';

class EventBus {
  constructor() {
    this.listeners = new Map();
    this.validator = eventValidator;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
      if (this.listeners.get(event).size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit(event, data) {
    // Validate contract payload
    this.validator.validate(event, data);

    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        try {
          callback(data);
        } catch (err) {
          console.error(`[EventBus] Error handling event "${event}":`, err);
        }
      }
    }
  }

  getTelemetry() {
    return this.validator.getTelemetry();
  }
}

export const events = new EventBus();
