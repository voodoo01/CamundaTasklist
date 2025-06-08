import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext'; // Import

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <NotificationProvider> {/* Wrap App */}
        <App />
      </NotificationProvider>
    </BrowserRouter>
  </React.StrictMode>
);
reportWebVitals();
