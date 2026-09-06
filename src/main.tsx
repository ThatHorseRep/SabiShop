import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { registerServiceWorker } from './pwa'

registerServiceWorker(({ registration }) => {
  window.dispatchEvent(
    new CustomEvent('sabi-shop:update', { detail: registration }),
  )
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
