import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  // Убираем React.StrictMode для предотвращения дублирования запросов
  <App />
);console.log('🚀 Deployed at Wed Jul 16 04:35:59 +07 2025');

console.log('🎉 ФИНАЛЬНЫЙ ТЕСТ ДЕПЛОЯ ПРОШЕЛ! Время:', new Date().toLocaleString());
