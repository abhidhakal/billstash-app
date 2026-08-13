import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Apply saved theme on load
const savedTheme = localStorage.getItem('billstash-theme') || 'system';
document.documentElement.setAttribute('data-theme', savedTheme);

if (savedTheme === 'system') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    document.documentElement.setAttribute('data-theme', 'system');
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
