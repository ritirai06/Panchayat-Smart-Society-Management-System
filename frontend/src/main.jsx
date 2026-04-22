import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <HashRouter>
    <App />
    <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
  </HashRouter>
)
