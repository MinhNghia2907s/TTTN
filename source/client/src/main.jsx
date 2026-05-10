import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { applyTheme, getInitialTheme } from './services/shared/themeService.js';
import './styles/admin.css';
import './styles/global.css';

// Áp dụng theme đã lưu trước khi app mount để giảm hiện tượng nháy giao diện khi refresh.
applyTheme(getInitialTheme());

// Khởi chạy React client và giữ router sẵn sàng cho toàn bộ trang giao diện người dùng.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
