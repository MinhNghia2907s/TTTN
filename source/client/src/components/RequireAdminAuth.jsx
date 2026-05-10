import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getStoredAdminUser, isAdminAuthenticated, isAdminPortalRole } from '../services/admin/adminAuthService.js';
import { getAdminAuthEventName } from '../services/admin/adminAuthStorage.js';

/**
 * Route guard admin dựa trên 2 lớp kiểm tra:
 * 1. có session admin hợp lệ hay chưa
 * 2. role hiện tại có thực sự thuộc nhóm `admin` / `staff` hay không
 */

/**
 * Chặn các route admin nếu chưa đăng nhập, đồng thời ghi nhớ trang đích cần quay lại.
 */
function RequireAdminAuth() {
  const location = useLocation();
  const [, setAuthVersion] = useState(0);
  const currentAdmin = getStoredAdminUser();

  useEffect(() => {
    /**
     * Theo dõi thay đổi session admin để route guard cập nhật ngay sau login, logout hoặc hết hạn phiên.
     */
    function syncAdminGuard() {
      setAuthVersion((currentValue) => currentValue + 1);
    }

    const adminAuthEventName = getAdminAuthEventName();
    window.addEventListener('storage', syncAdminGuard);
    window.addEventListener(adminAuthEventName, syncAdminGuard);

    return () => {
      window.removeEventListener('storage', syncAdminGuard);
      window.removeEventListener(adminAuthEventName, syncAdminGuard);
    };
  }, []);

  if (!isAdminAuthenticated()) {
    return (
      <Navigate
        replace
        state={{ redirectTo: `${location.pathname}${location.search}` }}
        to="/admin/login"
      />
    );
  }

  // Chốt thêm theo role để chỉ admin và staff mới đi được vào khu quản lý.
  if (!isAdminPortalRole(currentAdmin?.role)) {
    return <Navigate replace to="/" />;
  }

  return <Outlet />;
}

export default RequireAdminAuth;
