import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import FormField from '../../components/FormField.jsx';
import { ADMIN_PERMISSION_KEYS, getStoredAdminUser, hasAdminPermission } from '../../services/admin/adminAuthService.js';
import { getAdminMeta } from '../../services/admin/adminMetaService.js';
import { getAdminUserDetail, toggleAdminUserDeleteFlag, updateAdminUser } from '../../services/admin/adminUserService.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { formatDateTime, getAdminRoleLabel, getAdminUserBadgeClass, getAdminUserStatusLabel } from '../../utils/adminFormatters.js';

const EMPTY_ADMIN_META = {
  editableUserRoleOptions: [],
  editableUserStatusOptions: [],
};

/**
 * State form user detail giữ đúng các field admin được phép chỉnh sửa.
 */
function createFormState(user) {
  return {
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    status: user.status,
  };
}

/**
 * Chuẩn hóa danh sách booking gần đây để phần render tránh phải kiểm tra null liên tục.
 */
function getRecentBookings(userDetail) {
  return Array.isArray(userDetail?.recentBookings) ? userDetail.recentBookings : [];
}

/**
 * Trang chi tiết người dùng giúp admin cập nhật hồ sơ và theo dõi booking gần đây.
 */
function AdminUserDetailPage() {
  const { userId } = useParams();
  const currentAdmin = getStoredAdminUser();
  const canManageUsers = hasAdminPermission(ADMIN_PERMISSION_KEYS.USERS_UPDATE, currentAdmin);
  const [userDetail, setUserDetail] = useState(null);
  const [adminMeta, setAdminMeta] = useState(EMPTY_ADMIN_META);
  const [formData, setFormData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    /**
     * Tải lại chi tiết mỗi khi đổi id để form luôn bám đúng người dùng đang quản lý.
     */
    async function loadUserDetail() {
      try {
        const [user, meta] = await Promise.all([getAdminUserDetail(userId), getAdminMeta()]);
        setUserDetail(user);
        setFormData(createFormState(user));
        setAdminMeta({
          editableUserRoleOptions: meta.editableUserRoleOptions ?? [],
          editableUserStatusOptions: meta.editableUserStatusOptions ?? [],
        });
        setErrorMessage('');
        setSuccessMessage('');
      } catch (error) {
        setErrorMessage(error.message);
      }
    }

    loadUserDetail();
  }, [userId]);

  /**
   * Cập nhật state cho form sửa user.
   */
  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((currentFormData) => ({ ...currentFormData, [name]: value }));
  }

  /**
   * Lưu thay đổi hồ sơ người dùng từ khu vực admin.
   */
  async function handleSubmit(event) {
    event.preventDefault();

    if (!canManageUsers) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updatedUser = await updateAdminUser(userId, {
        ...formData,
        deleteFlg: userDetail.deleteFlg,
      });

      setUserDetail(updatedUser);
      setFormData(createFormState(updatedUser));
      setSuccessMessage('Đã lưu cập nhật cho tài khoản này.');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Xóa hoặc khôi phục tài khoản ngay tại trang detail.
   */
  async function handleToggleDelete() {
    if (!canManageUsers) {
      return;
    }

    const shouldContinue = userDetail.deleteFlg
      ? window.confirm('Bạn muốn khôi phục tài khoản này?')
      : window.confirm('Bạn có chắc muốn xóa tài khoản này không?');

    if (!shouldContinue) {
      return;
    }

    try {
      const updatedUser = await toggleAdminUserDeleteFlag(userDetail);
      setUserDetail(updatedUser);
      setFormData(createFormState(updatedUser));
      setSuccessMessage(updatedUser.deleteFlg ? 'Tài khoản đã được xóa.' : 'Tài khoản đã được khôi phục.');
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  if (errorMessage && !userDetail) {
    return (
      <section className="content-card admin-empty-state">
        <h2>Không tìm thấy tài khoản</h2>
        <p>{errorMessage}</p>
        <Link className="button button-primary" to="/admin/users">
          Quay lại danh sách
        </Link>
      </section>
    );
  }

  if (!userDetail || !formData) {
    return <p className="helper-text">Đang tải chi tiết người dùng...</p>;
  }

  const recentBookings = getRecentBookings(userDetail);

  return (
    <div className="page-stack">
      <section className="content-card">
        <div className="section-heading-row">
          <div>
            <p className="booking-id">USER #{userDetail.id}</p>
            <h2>{userDetail.fullName}</h2>
            <p>{userDetail.email}</p>
          </div>

          <div className="chip-row">
            <span className="chip">{getAdminRoleLabel(userDetail.role)}</span>
            <span className={getAdminUserBadgeClass(userDetail.status, userDetail.deleteFlg)}>
              {userDetail.deleteFlg ? 'Đã xóa mềm' : getAdminUserStatusLabel(userDetail.status)}
            </span>
          </div>
        </div>
      </section>

      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
      {successMessage ? <p className="success-message">{successMessage}</p> : null}

      <div className="admin-detail-grid">
        <section className="content-card">
          <h2>Tổng quan tài khoản</h2>
          <div className="admin-summary-grid">
            <article className="admin-mini-card">
              <span>Ngày tạo</span>
              <strong>{formatDate(userDetail.createdAt)}</strong>
            </article>
            <article className="admin-mini-card">
              <span>Lần cập nhật gần nhất</span>
              <strong>{formatDateTime(userDetail.updatedAt)}</strong>
            </article>
            <article className="admin-mini-card">
              <span>Số booking</span>
              <strong>{userDetail.bookingCount}</strong>
            </article>
            <article className="admin-mini-card">
              <span>Tổng chi tiêu</span>
              <strong>{formatCurrency(userDetail.totalSpent)}</strong>
            </article>
          </div>

          <div className="admin-profile-summary">
            <p>
              <strong>Tên đăng nhập:</strong> {userDetail.username}
            </p>
            <p>
              <strong>Số điện thoại:</strong> {userDetail.phone}
            </p>
            <p>
              <strong>Vai trò hiện tại:</strong> {getAdminRoleLabel(userDetail.role)}
            </p>
          </div>
        </section>

        <section className="content-card">
          <form className="form-card" onSubmit={handleSubmit}>
            <h2>Cập nhật hồ sơ và phân quyền</h2>
            {!canManageUsers ? (
              <p className="helper-text">Tài khoản staff chỉ có quyền xem thông tin người dùng. Cập nhật hồ sơ, đổi vai trò và xóa mềm cần tài khoản admin.</p>
            ) : null}
            <div className="admin-form-grid">
              <FormField disabled={!canManageUsers} label="Họ và tên" name="fullName" onChange={handleChange} value={formData.fullName} />
              <FormField disabled={!canManageUsers} label="Email" name="email" onChange={handleChange} value={formData.email} />
              <FormField disabled={!canManageUsers} label="Số điện thoại" name="phone" onChange={handleChange} value={formData.phone} />
              <FormField
                as="select"
                disabled={!canManageUsers}
                label="Vai trò"
                name="role"
                onChange={handleChange}
                options={adminMeta.editableUserRoleOptions}
                value={formData.role}
              />
              <FormField
                as="select"
                disabled={!canManageUsers}
                label="Trạng thái tài khoản"
                name="status"
                onChange={handleChange}
                options={adminMeta.editableUserStatusOptions}
                value={formData.status}
              />
            </div>

            <div className="admin-form-actions">
              {canManageUsers ? (
                <button className="button button-primary" disabled={isSubmitting} type="submit">
                  {isSubmitting ? 'Đang lưu...' : 'Lưu cập nhật'}
                </button>
              ) : null}
              {canManageUsers ? (
                <button
                  className={userDetail.deleteFlg ? 'button button-success' : 'button button-danger'}
                  type="button"
                  onClick={handleToggleDelete}
                >
                  {userDetail.deleteFlg ? 'Khôi phục tài khoản' : 'Xóa'}
                </button>
              ) : null}
              <Link className="button button-secondary" to="/admin/users">
                Về danh sách
              </Link>
            </div>
          </form>
        </section>
      </div>

      <section className="content-card">
        <h2>Booking gần đây</h2>
        {recentBookings.length ? (
          <div className="admin-list-stack">
            {recentBookings.map((booking) => (
              <article className="admin-list-item" key={booking.bookingCode}>
                <div>
                  <strong>{booking.bookingCode}</strong>
                  <p className="helper-text">{booking.tourTitle}</p>
                </div>
                <div className="admin-list-item-side">
                  <span className="chip">{formatDate(booking.departureDate)}</span>
                  <span className="chip">{formatCurrency(booking.totalPrice)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-empty-state">
            <h3>Tài khoản này chưa phát sinh booking gần đây</h3>
            <p>Khi có booking mới, khu vực này sẽ hiển thị để bổ sung ngữ cảnh cho quá trình rà soát tài khoản.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminUserDetailPage;
