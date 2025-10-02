import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';

// blank line above keeps import/order happy

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  throw new Error("Root element with id 'root' not found.");
}
