import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionHeading from '../../components/SectionHeading.jsx';
import { ADMIN_PERMISSION_KEYS, getStoredAdminUser, hasAdminPermission } from '../../services/admin/adminAuthService.js';
import { getAdminMeta } from '../../services/admin/adminMetaService.js';
import { getAdminUsers, toggleAdminUserDeleteFlag, updateAdminUser } from '../../services/admin/adminUserService.js';
import { formatCurrency } from '../../utils/formatters.js';
import { formatDateTime, getAdminRoleLabel, getAdminUserBadgeClass, getAdminUserStatusLabel } from '../../utils/adminFormatters.js';

const EMPTY_ADMIN_META = {
  userRoleOptions: [],
  userStatusOptions: [],
};

/**
 * Lọc user theo từ khóa, vai trò và trạng thái đang chọn trên UI.
 */
function filterUsers(userList, searchKeyword, roleFilter, statusFilter) {
  const normalizedKeyword = searchKeyword.trim().toLowerCase();

  return userList.filter((user) => {
    const matchesKeyword =
      !normalizedKeyword ||
      user.fullName.toLowerCase().includes(normalizedKeyword) ||
      user.email.toLowerCase().includes(normalizedKeyword) ||
      user.phone.includes(normalizedKeyword) ||
      String(user.id).includes(normalizedKeyword);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesKeyword && matchesRole && matchesStatus;
  });
}

/**
 * Gom KPI người dùng để phần render chỉ còn hiển thị số liệu.
 */
function buildUserSummary(filteredUsers) {
  const activeUsers = filteredUsers.filter((user) => user.status === 'active' && !user.deleteFlg);
  const blockedUsers = filteredUsers.filter((user) => user.status === 'blocked');
  const internalUsers = filteredUsers.filter((user) => user.role === 'admin' || user.role === 'staff');
  const deletedUsers = filteredUsers.filter((user) => user.deleteFlg);

  return {
    activeUsers,
    activeUsersPercent: Math.round((activeUsers.length / Math.max(filteredUsers.length, 1)) * 100),
    blockedUsers,
    deletedUsers,
    filteredSpending: filteredUsers.reduce((sum, user) => sum + user.totalSpent, 0),
    internalUsers,
    usersWithBookings: filteredUsers.filter((user) => user.bookingCount > 0),
  };
}

/**
 * Danh sách người dùng cho admin, bám dữ liệu thật từ backend để lọc và cập nhật nhanh.
 */
function AdminUserListPage() {
  const currentAdmin = getStoredAdminUser();
  const canManageUsers = hasAdminPermission(ADMIN_PERMISSION_KEYS.USERS_UPDATE, currentAdmin);
  const [userList, setUserList] = useState([]);
  const [adminMeta, setAdminMeta] = useState(EMPTY_ADMIN_META);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  /**
   * Tải danh sách user để bảng và nhóm thống kê dùng chung một nguồn dữ liệu.
   */
  async function loadUsers() {
    setIsLoading(true);

    try {
      const [users, meta] = await Promise.all([getAdminUsers(), getAdminMeta()]);
      setUserList(users);
      setAdminMeta({
        userRoleOptions: meta.userRoleOptions ?? [],
        userStatusOptions: meta.userStatusOptions ?? [],
      });
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Đổi nhanh trạng thái active hoặc inactive ngay trên danh sách.
   */
  async function handleQuickStatusChange(user) {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';

    try {
      const updatedUser = await updateAdminUser(user.id, {
        deleteFlg: false,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        status: nextStatus,
      });

      setUserList((currentUsers) => currentUsers.map((item) => (item.id === user.id ? updatedUser : item)));
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  /**
   * Xóa hoặc khôi phục tài khoản người dùng.
   */
  async function handleToggleDelete(user) {
    const shouldContinue = user.deleteFlg
      ? window.confirm('Bạn muốn khôi phục tài khoản này?')
      : window.confirm('Bạn có chắc muốn xóa tài khoản này không?');

    if (!shouldContinue) {
      return;
    }

    try {
      const updatedUser = await toggleAdminUserDeleteFlag(user);
      setUserList((currentUsers) => currentUsers.map((item) => (item.id === user.id ? updatedUser : item)));
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  const filteredUsers = useMemo(
    () => filterUsers(userList, searchKeyword, roleFilter, statusFilter),
    [roleFilter, searchKeyword, statusFilter, userList],
  );

  const { activeUsers, activeUsersPercent, blockedUsers, deletedUsers, filteredSpending, internalUsers, usersWithBookings } =
    useMemo(() => buildUserSummary(filteredUsers), [filteredUsers]);

  return (
    <div className="page-stack">
      <section className="admin-toolbar-card">
        <div className="admin-toolbar-head">
          <SectionHeading
            eyebrow="Người dùng"
            title="Điều hành tài khoản, phân quyền và trạng thái người dùng"
            description="Theo dõi vai trò, trạng thái sử dụng, mức chi tiêu và mức độ tương tác của từng tài khoản."
          />
          <button className="button button-secondary" type="button" onClick={loadUsers}>
            Tải lại dữ liệu
          </button>
        </div>

        <div className="admin-kpi-grid">
          <article className="admin-kpi-card">
            <span>Tổng tài khoản đang hiển thị</span>
            <strong>{filteredUsers.length}</strong>
            <div className="admin-kpi-meta">{userList.length} tài khoản trong nguồn dữ liệu</div>
          </article>
          <article className="admin-kpi-card">
            <span>Đang hoạt động</span>
            <strong>{activeUsers.length}</strong>
            <div className="admin-kpi-meta">{activeUsersPercent}% trong bộ lọc hiện tại</div>
          </article>
          <article className="admin-kpi-card">
            <span>Tài khoản nội bộ</span>
            <strong>{internalUsers.length}</strong>
            <div className="admin-kpi-meta">Admin và staff trong hệ thống</div>
          </article>
          <article className="admin-kpi-card">
            <span>Tổng chi tiêu</span>
            <strong>{formatCurrency(filteredSpending)}</strong>
            <div className="admin-kpi-meta">{blockedUsers.length} tài khoản bị khóa cần rà soát</div>
          </article>
        </div>
      </section>

      <section className="admin-toolbar-card">
        <div className="admin-toolbar-grid">
          <div>
            <h3>Bộ lọc và phạm vi thống kê</h3>
            <p>Lọc theo vai trò, trạng thái hoặc từ khóa để tập trung vào đúng nhóm tài khoản cần rà soát.</p>
          </div>
          <div className="admin-results-meta">
            <span className="chip">{activeUsers.length} hoạt động</span>
            <span className="chip">{blockedUsers.length} bị khóa</span>
            <span className="chip">{deletedUsers.length} xóa mềm</span>
          </div>
        </div>

        <div className="admin-filter-grid">
          <label className="form-field">
            <span>Tìm theo tên, email, số điện thoại hoặc mã user</span>
            <input
              placeholder="Ví dụ: chau@example.com hoặc 12"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Vai trò</span>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              {adminMeta.userRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Trạng thái</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {adminMeta.userStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

      <section className="admin-report-card">
        <div className="admin-table-caption">
          <div>
            <h2>Tài khoản</h2>
            <p className="helper-text">Mở chi tiết để cập nhật hồ sơ, phân quyền và trạng thái vận hành của tài khoản.</p>
          </div>
          <div className="admin-results-meta">
            <span className="chip">{filteredUsers.length} kết quả</span>
            <span className="chip">{usersWithBookings.length} có booking</span>
          </div>
        </div>

        {isLoading ? (
          <p className="helper-text">Đang tải danh sách người dùng...</p>
        ) : filteredUsers.length ? (
          <div className="admin-table-shell admin-table-shell-users">
            <table className="admin-table admin-table-users">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Booking</th>
                  <th>Tổng chi</th>
                  <th>Cập nhật</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td data-label="Người dùng">
                      <div className="admin-table-user">
                        <strong>{user.fullName}</strong>
                        <span>#{user.id}</span>
                        <p>{user.email}</p>
                      </div>
                    </td>
                    <td data-label="Vai trò">
                      <span className="chip">{getAdminRoleLabel(user.role)}</span>
                    </td>
                    <td data-label="Trạng thái">
                      <span className={getAdminUserBadgeClass(user.status, user.deleteFlg)}>
                        {user.deleteFlg ? 'Đã xóa mềm' : getAdminUserStatusLabel(user.status)}
                      </span>
                    </td>
                    <td data-label="Booking">{user.bookingCount}</td>
                    <td data-label="Tổng chi">{formatCurrency(user.totalSpent)}</td>
                    <td data-label="Cập nhật">{formatDateTime(user.updatedAt)}</td>
                    <td data-label="Thao tác">
                      <div className="admin-table-actions">
                        <Link className="button button-secondary" to={`/admin/users/${user.id}`}>
                          Chi tiết
                        </Link>
                        {canManageUsers ? (
                          <button className="button button-ghost" type="button" onClick={() => handleQuickStatusChange(user)}>
                            {user.status === 'active' ? 'Tạm ngưng' : 'Kích hoạt'}
                          </button>
                        ) : null}
                        {canManageUsers ? (
                          <button
                            className={user.deleteFlg ? 'button button-success' : 'button button-danger'}
                            type="button"
                            onClick={() => handleToggleDelete(user)}
                          >
                            {user.deleteFlg ? 'Khôi phục' : 'Xóa'}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-state">
            <h3>Không có tài khoản phù hợp bộ lọc</h3>
            <p>Thử nới rộng điều kiện tìm kiếm hoặc thay đổi vai trò, trạng thái để rà soát thêm dữ liệu.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminUserListPage;
