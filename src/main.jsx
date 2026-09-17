import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { KioskProvider } from './context/KioskContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <KioskProvider>
      <App />
    </KioskProvider>
  </React.StrictMode>,
)
