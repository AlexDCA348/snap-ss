import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initAuraCssVars } from './game/auraAssets'
import './index.css'
import App from './App.tsx'

initAuraCssVars()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
