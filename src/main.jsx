import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// blank line above keeps import/order happy

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
