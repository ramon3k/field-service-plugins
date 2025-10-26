import React from 'react'
import ReactDOM from 'react-dom/client'
import { CustomerPortalApp } from './components/CustomerPortalApp'
import './styles.css' // Include the main styles

// Customer Portal Entry Point - Separate from the main admin application
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CustomerPortalApp />
  </React.StrictMode>,
)