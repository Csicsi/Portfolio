class ResizeObserverPolyfill {
  private _callback: any;
  constructor(callback: any) {
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
