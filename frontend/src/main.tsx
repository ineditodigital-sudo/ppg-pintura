import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './styles/tokens.css'
import './styles/base.css'

// Marca que el JS arrancó: `base.css` sólo oculta los bloques `.reveal` bajo
// `.js`, de modo que si el bundle no carga el contenido sigue siendo visible.
document.documentElement.classList.add('js')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
