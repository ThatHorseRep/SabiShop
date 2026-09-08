import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LandingPage } from './LandingPage'
import './landing.css'

/*
 * Public landing entry (C05). This document is the marketing experience, not
 * the operational application: it does not register the service worker or
 * import operational modules. The 'js' class gates progressive enhancement
 * (scroll reveals, tagline word activation) so content stays fully readable
 * whenever scripting or observers are unavailable.
 */
document.documentElement.classList.add('js')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LandingPage />
  </StrictMode>,
)
