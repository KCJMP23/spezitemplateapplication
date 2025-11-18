import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { logger } from '@/utils/logger';
import { config } from '@/utils/config';

// Log application startup
logger.info('Application starting', {
  version: config.version,
  environment: config.environment,
});

// Register service worker for PWA
if ('serviceWorker' in navigator && config.environment === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        logger.info('Service Worker registered', {
          scope: registration.scope,
        });
      })
      .catch((error) => {
        logger.error('Service Worker registration failed', error);
      });
  });
}

// Error boundary for uncaught errors
window.addEventListener('error', (event) => {
  logger.error('Uncaught error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', {
    reason: event.reason,
  });
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
