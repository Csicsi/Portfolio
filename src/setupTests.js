class ResizeObserverPolyfill {
  constructor(callback) {
    this._callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = ResizeObserverPolyfill;
}

import '@testing-library/jest-dom';
