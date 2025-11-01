import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { MessengerNotificationProvider } from './contexts/MessengerNotificationContext'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MessengerNotificationProvider>
      <App />
    </MessengerNotificationProvider>
  </React.StrictMode>
)
