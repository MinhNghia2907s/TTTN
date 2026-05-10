import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar.jsx';
import { getStoredAdminUser, logoutAdmin } from '../services/admin/adminAuthService.js';
import { getAdminAuthEventName } from '../services/admin/adminAuthStorage.js';
import { applyTheme, DARK_THEME, getInitialTheme, LIGHT_THEME, saveTheme } from '../services/shared/themeService.js';

const pageTitles = {
  '/admin': {
    icon: 'dashboard',
    title: 'Dashboard quản trị',
    description: 'Tổng hợp chỉ số vận hành trọng yếu về người dùng, tour, booking và thanh toán trên toàn hệ thống.',
  },
  '/admin/users': {
    icon: 'users',
    title: 'Người dùng',
    description: 'Quản lý tài khoản, phân quyền và trạng thái sử dụng trên dữ liệu vận hành hiện tại.',
  },
  '/admin/tours': {
    icon: 'tours',
    title: 'Danh sách tour',
    description: 'Theo dõi trạng thái vận hành tour, lịch khởi hành và truy cập nhanh các biểu mẫu cập nhật.',
  },
  '/admin/tours/new': {
    icon: 'tours',
    title: 'Thêm tour mới',
    description: 'Thiết lập tour mới, cấu hình lịch trình và mở các kỳ khởi hành từ khu vực quản trị.',
  },
  '/admin/bookings': {
    icon: 'bookings',
    title: 'Danh sách booking',
    description: 'Theo dõi tiến độ xử lý booking, trạng thái thanh toán và các đơn cần ưu tiên vận hành.',
  },
  '/admin/payments': {
    icon: 'payments',
    title: 'Danh sách thanh toán',
    description: 'Đối soát giao dịch, xác nhận dòng tiền và xử lý các trường hợp hoàn tiền theo nghiệp vụ.',
  },
};

/**
 * Suy ra tiêu đề và mô tả topbar từ route hiện tại.
 * Tách riêng helper này để luồng layout dễ đọc hơn thay vì lồng nhiều `if` trong component.
 */
function getCurrentPageMeta(pathname) {
  if (pathname.startsWith('/admin/users/')) {
    return {
      icon: 'users',
      title: 'Chi tiết người dùng',
      description: 'Theo dõi hồ sơ tài khoản, phân quyền, trạng thái sử dụng và lịch sử phát sinh liên quan.',
    };
  }

  if (pathname.startsWith('/admin/tours/') && pathname.endsWith('/edit')) {
    return {
      icon: 'tours',
      title: 'Chỉnh sửa tour',
      description: 'Cập nhật thông tin tour, lịch trình, lịch khởi hành và quỹ chỗ theo dữ liệu vận hành hiện tại.',
    };
  }

  if (pathname.startsWith('/admin/bookings/')) {
    return {
      icon: 'bookings',
      title: 'Chi tiết booking',
      description: 'Rà soát thông tin đơn đặt tour, cập nhật trạng thái xử lý và đồng bộ tiến độ thanh toán.',
    };
  }

  if (pathname.startsWith('/admin/payments/')) {
    return {
      icon: 'payments',
      title: 'Chi tiết thanh toán',
      description: 'Kiểm tra giao dịch, cập nhật trạng thái đối soát và thực hiện hoàn tiền khi cần.',
    };
  }

  return (
    pageTitles[pathname] ?? {
      icon: 'dashboard',
      title: 'Quản trị hệ thống',
      description: 'Màn hình điều hướng cho phần quản lý.',
    }
  );
}

/**
 * Layout riêng cho admin, tách biệt với giao diện user để luồng điều hướng rõ ràng hơn.
 */
function AdminLayout() {
  const accountMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [themeMode, setThemeMode] = useState(getInitialTheme);
  const [currentAdmin, setCurrentAdmin] = useState(getStoredAdminUser());
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const isDarkMode = themeMode === DARK_THEME;

  useEffect(() => {
    // Dùng chung hệ thống theme với phần user để toàn app giữ một cơ chế nhất quán.
    applyTheme(themeMode);
    saveTheme(themeMode);
  }, [themeMode]);

  useEffect(() => {
    /**
     * Đồng bộ thông tin admin khi localStorage thay đổi sau đăng nhập hoặc đăng xuất.
     */
    function syncAdminSession() {
      setCurrentAdmin(getStoredAdminUser());
    }

    const adminAuthEventName = getAdminAuthEventName();
    window.addEventListener('storage', syncAdminSession);
    window.addEventListener(adminAuthEventName, syncAdminSession);

    return () => {
      window.removeEventListener('storage', syncAdminSession);
      window.removeEventListener(adminAuthEventName, syncAdminSession);
    };
  }, []);

  useEffect(() => {
    /**
     * Mỗi lần đổi route thì đóng dropdown tài khoản để header không giữ trạng thái cũ.
     */
    setIsAccountMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    /**
     * Đóng menu tài khoản khi người dùng bấm ra ngoài vùng dropdown.
     */
    function handleClickOutside(event) {
      if (!accountMenuRef.current?.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    }

    window.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Chuyển qua lại chế độ sáng tối cho cả giao diện admin.
   */
  function handleToggleTheme() {
    setThemeMode((currentTheme) => (currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME));
  }

  /**
   * Đăng xuất khỏi khu vực admin và đưa người dùng về trang login admin.
   */
  function handleLogout() {
    logoutAdmin();
    navigate('/admin/login', { replace: true });
  }

  const currentPageMeta = useMemo(() => getCurrentPageMeta(location.pathname), [location.pathname]);

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-shell">
          <div className="admin-topbar-copy">
            <div className="admin-topbar-title-row">
              <span className="admin-page-icon" role="img" title="Chill n Free Admin">
                <img alt="" src="/favicon.svg" />
              </span>
              <div className="admin-header-brand">
                <strong>Chill n Free Admin</strong>
                <span>Điều phối vận hành</span>
              </div>
              <span className="chip">{currentAdmin?.title ?? 'Quản trị hệ thống'}</span>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <button
              aria-label={isDarkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              className="theme-toggle"
              type="button"
              onClick={handleToggleTheme}
            >
              <span aria-hidden="true" className="theme-toggle-icon">
                {isDarkMode ? '☀' : '☾'}
              </span>
            </button>

            <div className="account-menu" ref={accountMenuRef}>
              <button
                aria-expanded={isAccountMenuOpen}
                className="account-menu-button"
                type="button"
                onClick={() => setIsAccountMenuOpen((currentValue) => !currentValue)}
              >
                <span className="account-menu-label">{currentAdmin?.fullName ?? 'Tài khoản admin'}</span>
                <span aria-hidden="true" className={`account-menu-caret ${isAccountMenuOpen ? 'open' : ''}`}>
                  ▾
                </span>
              </button>

              {isAccountMenuOpen ? (
                <div className="account-dropdown">
                  <Link className="account-dropdown-link" to="/account">
                    Cài đặt tài khoản
                  </Link>
                  <Link className="account-dropdown-link" to="/account/password">
                    Đổi mật khẩu
                  </Link>
                  <Link className="account-dropdown-link" to="/">
                    Trang người dùng
                  </Link>
                  <button className="account-dropdown-link danger" type="button" onClick={handleLogout}>
                    Đăng xuất
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="admin-body">
        <AdminSidebar currentAdmin={currentAdmin} />

        <div className="admin-workspace">
          <main className="admin-main">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
