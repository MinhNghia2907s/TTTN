import { Link, NavLink } from 'react-router-dom';

const adminNavItems = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/users', label: 'Quản lý người dùng' },
  { to: '/admin/tours', label: 'Quản lý tour' },
  { to: '/admin/bookings', label: 'Quản lý booking' },
  { to: '/admin/payments', label: 'Quản lý thanh toán' },
  { to: '/admin/promotions', label: 'Quản lý khuyến Mãi' },
];

/**
 * Khai báo menu một chỗ để sidebar dễ rà soát khi thêm màn quản trị mới.
 */

/**
 * Sidebar cố định cho khu vực admin, giữ menu ngắn gọn nhưng đủ toàn bộ scope quản trị hiện tại.
 */
function AdminSidebar({ currentAdmin }) {
  return (
    <aside className="admin-sidebar">
      <nav className="admin-nav admin-nav-stack">
        {adminNavItems.map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) => (isActive ? 'admin-nav-link active' : 'admin-nav-link')}
            end={item.to === '/admin'}
            to={item.to}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <p className="section-eyebrow">Tài khoản</p>
        <strong>{currentAdmin?.fullName ?? 'Tài khoản admin'}</strong>
        <span>{currentAdmin?.title ?? 'Quản trị hệ thống'}</span>
      </div>
    </aside>
  );
}

export default AdminSidebar;
