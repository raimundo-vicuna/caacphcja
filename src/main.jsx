import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// El router usa "#" (HashRouter). Si alguien entra directo a /algo, el hosting sirve index.html
// y aquí lo pasamos a /#/algo para que el router lo resuelva (o muestre la 404).
const { pathname, search, hash } = window.location
if (!hash && pathname !== '/' && pathname !== '/index.html') {
  window.history.replaceState(null, '', `/#${pathname}${search}`)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
