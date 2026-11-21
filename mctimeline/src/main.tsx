import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

function App(): React.ReactElement {
  return <main className="placeholder">Minecraft Timeline — veri temeli hazır.</main>
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
