import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { isAdminPortalRole } from '../services/admin/adminAuthService.js';
import { getAuthEventName } from '../services/user/authStorage.js';
import { getStoredUser, logout } from '../services/user/authService.js';
import { DARK_THEME } from '../services/shared/themeService.js';

const navItems = [
  { to: '/', label: 'Trang chủ' },
  { to: '/tours', label: 'Danh sách tour' },
  { to: '/bookings', label: 'Booking của tôi' },
];

/**
 * Header điều hướng chính cho khu vực người dùng, gồm trạng thái đăng nhập và nút đổi theme.
 */
function Header({ themeMode, onToggleTheme }) {
  const menuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const isDarkMode = themeMode === DARK_THEME;
  const canReturnToAdmin = isAdminPortalRole(currentUser?.role);

  useEffect(() => {
    /**
     * Giữ header luôn đồng bộ khi dữ liệu auth thay đổi trong storage hoặc ngay trong cùng tab.
     */
    function syncAuthState() {
      setCurrentUser(getStoredUser());
    }

    const authEventName = getAuthEventName();
    window.addEventListener('storage', syncAuthState);
    window.addEventListener(authEventName, syncAuthState);

    return () => {
      window.removeEventListener('storage', syncAuthState);
      window.removeEventListener(authEventName, syncAuthState);
    };
  }, []);

  useEffect(() => {
    /**
     * Mỗi lần đổi route thì đóng menu mobile và dropdown để header không giữ trạng thái cũ.
     */
    setIsMenuOpen(false);
    setIsAccountMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    /**
     * Đóng dropdown khi người dùng bấm ra ngoài vùng menu để thao tác tự nhiên hơn.
     */
    function handleClickOutside(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    }

    window.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Đăng xuất ở phía client và đưa người dùng trở về trang đăng nhập.
   */
  function handleLogout() {
    logout();
    setIsMenuOpen(false);
    setIsAccountMenuOpen(false);
    navigate('/login');
  }

  return (
    <header className="site-header">
      <div className="container header-shell">
        <Link className="brand-mark" to="/">
          <span aria-hidden="true" className="brand-emblem">
            <svg fill="none" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="tourflow-brand-gradient" x1="12" x2="52" y1="10" y2="54" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FFB761" />
                  <stop offset="0.45" stopColor="#EF7B45" />
                  <stop offset="1" stopColor="#10233C" />
                </linearGradient>
                <linearGradient id="tourflow-sail-highlight" x1="22" x2="45" y1="18" y2="40" gradientUnits="userSpaceOnUse">
                  <stop stopColor="rgba(255,255,255,0.98)" />
                  <stop offset="1" stopColor="rgba(255,255,255,0.74)" />
                </linearGradient>
              </defs>
              <rect fill="url(#tourflow-brand-gradient)" height="48" rx="18" width="48" x="8" y="8" />
              <path d="M32 18.5V41.7" stroke="rgba(255,255,255,0.98)" strokeLinecap="round" strokeWidth="2.4" />
              <path d="M32 20.6L44.2 33.9H32V20.6Z" fill="url(#tourflow-sail-highlight)" />
              <path d="M31 24.6L23.1 33.8H31V24.6Z" fill="rgba(255,255,255,0.88)" />
              <path
                d="M16.8 39.2C21.9 38 27.7 37.4 34 37.4C38.9 37.4 43.5 37.8 47.2 38.8L43.1 45.2H21L16.8 39.2Z"
                fill="rgba(255,255,255,0.96)"
              />
              <path d="M22.2 38.5H41.9L39.4 42H24.5L22.2 38.5Z" fill="rgba(255,255,255,0.8)" />
              <path
                d="M18.8 47.2C22.1 45.9 25.1 45.9 28.4 47.2C31.7 48.5 34.6 48.5 38 47.2C41.3 45.9 44.3 45.9 47.6 47.2"
                stroke="rgba(255,255,255,0.72)"
                strokeLinecap="round"
                strokeWidth="2"
              />
              <path
                d="M22.4 49.9C24.9 49 27.1 49 29.5 49.9C31.9 50.8 34.1 50.8 36.6 49.9C39 49 41.2 49 43.6 49.9"
                stroke="rgba(255,255,255,0.45)"
                strokeLinecap="round"
                strokeWidth="1.6"
              />
            </svg>
          </span>
          <span className="brand-wordmark">
            <strong>Chill n Free</strong>
            <span>Website bán gói tour du lịch</span>
          </span>
        </Link>

        <button className="menu-toggle" type="button" onClick={() => setIsMenuOpen((current) => !current)}>
          Menu
        </button>

        <nav className={`main-nav ${isMenuOpen ? 'open' : ''}`}>
          {/* Đóng menu mobile sau khi chọn route để luồng điều hướng gọn gàng hơn. */}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              to={item.to}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <button
            aria-label={isDarkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            className="theme-toggle"
            type="button"
            onClick={onToggleTheme}
          >
            <span aria-hidden="true" className="theme-toggle-icon">
              {isDarkMode ? '☀' : '☾'}
            </span>
          </button>

          {currentUser ? (
            <div className="account-menu" ref={menuRef}>
              {/* Nút tài khoản thay cho câu "Xin chào ...", mở ra các thao tác quản lý hồ sơ. */}
              <button
                aria-expanded={isAccountMenuOpen}
                className="account-menu-button"
                type="button"
                onClick={() => setIsAccountMenuOpen((current) => !current)}
              >
                <span className="account-menu-label">{currentUser.fullName || 'Tài khoản'}</span>
                <span aria-hidden="true" className={`account-menu-caret ${isAccountMenuOpen ? 'open' : ''}`}>
                  ▾
                </span>
              </button>

              {isAccountMenuOpen ? (
                <div className="account-dropdown">
                  {/* Các route này đều nằm sau RequireAuth nên chỉ user đã đăng nhập mới truy cập được. */}
                  {canReturnToAdmin ? (
                    <Link className="account-dropdown-link" to="/admin">
                      Trang quản lý
                    </Link>
                  ) : null}
                  <Link className="account-dropdown-link" to="/account">
                    Cài đặt tài khoản
                  </Link>
                  <Link className="account-dropdown-link" to="/account/password">
                    Đổi mật khẩu
                  </Link>
                  <button className="account-dropdown-link danger" type="button" onClick={handleLogout}>
                    Đăng xuất
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <div className="account-menu" ref={menuRef}>
                <button
                  aria-expanded={isAccountMenuOpen}
                  className="button button-primary"
                  type="button"
                  onClick={() => setIsAccountMenuOpen((current) => !current)}
                >
                  <span>Đăng nhập</span>
                  <span aria-hidden="true" className={`account-menu-caret ${isAccountMenuOpen ? 'open' : ''}`}>
                    ▾
                  </span>
                </button>

                {isAccountMenuOpen ? (
                  <div className="account-dropdown">
                    <Link className="account-dropdown-link" to="/login">
                      Đăng nhập người dùng
                    </Link>
                    <Link className="account-dropdown-link" to="/admin/login">
                      Đăng nhập quản trị
                    </Link>
                  </div>
                ) : null}
              </div>

              <Link className="button button-primary" to="/register">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
