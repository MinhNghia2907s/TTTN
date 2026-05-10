import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getStoredUser, isAuthenticated } from '../services/user/authService.js';
import { isAdminPortalRole } from '../services/admin/adminAuthService.js';
import { getAuthEventName } from '../services/user/authStorage.js';

function isSharedAccountPage(pathname) {
  return pathname === '/account' || pathname === '/account/password';
}

/**
 * Chặn các route cần đăng nhập và chuyển người dùng về trang login nếu chưa có token.
 */
function RequireAuth() {
  const location = useLocation();
  const [, setAuthVersion] = useState(0);
  const currentUser = getStoredUser();

  useEffect(() => {
    /**
     * Buộc guard render lại ngay khi phiên bị xóa hoặc được cập nhật trong cùng tab.
     */
    function syncAuthGuard() {
      setAuthVersion((currentValue) => currentValue + 1);
    }

    const authEventName = getAuthEventName();
    window.addEventListener('storage', syncAuthGuard);
    window.addEventListener(authEventName, syncAuthGuard);

    return () => {
      window.removeEventListener('storage', syncAuthGuard);
      window.removeEventListener(authEventName, syncAuthGuard);
    };
  }, []);

  if (!isAuthenticated()) {
    return <Navigate replace state={{ redirectTo: `${location.pathname}${location.search}` }} to="/login" />;
  }

  // Nếu đang là admin hoặc staff thì điều hướng sang khu quản lý thay vì ở lại các trang nghiệp vụ người dùng.
  if (isAdminPortalRole(currentUser?.role) && !isSharedAccountPage(location.pathname)) {
    return <Navigate replace to="/admin" />;
  }

  return <Outlet />;
}

export default RequireAuth;
