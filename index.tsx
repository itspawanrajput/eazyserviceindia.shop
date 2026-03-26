
import React from 'react';
import './src/index.css';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Global Error Tracking for Frontend
import { reportClientError } from './services/api';

window.onerror = function (message, source, lineno, colno, error) {
  reportClientError({
    message: String(message),
    stack: error?.stack,
    url: source,
    line: lineno,
    col: colno
  }).catch(() => {});
};

window.addEventListener('unhandledrejection', function(event) {
  reportClientError({
    message: 'Unhandled Promise Rejection: ' + String(event.reason),
    stack: event.reason?.stack,
    url: window.location.href,
    line: 0,
    col: 0
  }).catch(() => {});
});

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
