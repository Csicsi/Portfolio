// Polyfill for ResizeObserver in test environment
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    constructor(_callback: ResizeObserverCallback) {
      // Polyfill implementation
    }
    observe() {
      // Polyfill implementation
    }
    unobserve() {
      // Polyfill implementation
    }
    disconnect() {
      // Polyfill implementation
    }
  };
}

import '@testing-library/jest-dom';
