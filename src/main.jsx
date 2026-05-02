// FORCE NUCLEAR CACHE PURGE - V7
if (typeof window !== 'undefined') {
  // 1. Unregister all service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) { registration.unregister(); }
    });
  }
  // 2. Clear all browser caches
  if ('caches' in window) {
    caches.keys().then(names => {
      for (let name of names) caches.delete(name);
    });
  }
  // 3. Clear localStorage for auth testing
  // localStorage.clear(); 
}
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './i18n'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
