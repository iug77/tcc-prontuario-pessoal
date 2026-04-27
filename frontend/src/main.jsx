import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Debug - verificar se variáveis de ambiente estão sendo lidas
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('NODE_ENV:', import.meta.env.NODE_ENV);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
