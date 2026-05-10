import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import AmbientEffect from '../components/AmbientEffect.jsx';
import Footer from '../components/Footer.jsx';
import Header from '../components/Header.jsx';
import { applyTheme, DARK_THEME, getInitialTheme, LIGHT_THEME, saveTheme } from '../services/shared/themeService.js';

/**
 * Layout dùng chung cho khu vực người dùng, giữ theme đã chọn đồng bộ trên toàn bộ client.
 */
function UserLayout() {
  const [themeMode, setThemeMode] = useState(getInitialTheme);

  useEffect(() => {
    // Áp dụng và lưu lại theme hiện tại để mọi trang dùng chung cùng một chế độ hiển thị.
    applyTheme(themeMode);
    saveTheme(themeMode);
  }, [themeMode]);

  /**
   * Chuyển qua lại giữa giao diện sáng và tối từ nút điều khiển chung trên header.
   */
  function handleToggleTheme() {
    setThemeMode((currentTheme) => (currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME));
  }

  return (
    <div className="page-shell">
      <AmbientEffect />
      <div className="page-shell-content">
        <Header themeMode={themeMode} onToggleTheme={handleToggleTheme} />
        <main className="page-main">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default UserLayout;
