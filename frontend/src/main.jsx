import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './i18n';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
      <Toaster
        position="bottom-right"
        gutter={10}
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '14px',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '13px',
            fontWeight: '500',
            padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)',
            background: 'linear-gradient(135deg, #0D1117 0%, #1C2333 100%)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.08)',
          },
          success: {
            iconTheme: { primary: '#C9933A', secondary: '#0D1117' },
            style: {
              background: 'linear-gradient(135deg, #0D1117 0%, #1C2333 100%)',
              color: '#fff',
              border: '1px solid rgba(201,147,58,0.25)',
            },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#0D1117' },
            style: {
              background: 'linear-gradient(135deg, #0D1117 0%, #1C2333 100%)',
              color: '#fff',
              border: '1px solid rgba(239,68,68,0.25)',
            },
          },
        }}
      />
    </AuthProvider>
  </BrowserRouter>
);
