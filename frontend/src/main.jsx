import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#ffffff',
                color: '#172b4d',
                border: '1px solid #dfe1e6',
                borderRadius: '8px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#22a06b', secondary: '#ffffff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
