import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import FormField from '../../components/FormField.jsx';
import { ADMIN_PERMISSION_KEYS, getStoredAdminUser, hasAdminPermission } from '../../services/admin/adminAuthService.js';
import { getAdminMeta } from '../../services/admin/adminMetaService.js';
import { getAdminBookingDetail, toggleAdminBookingDeleteFlag, updateAdminBooking } from '../../services/admin/adminBookingService.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import {
  formatDateTime,
  getAdminBookingBadgeClass,
  getAdminBookingStatusLabel,
  getAdminPaymentBadgeClass,
  getAdminPaymentMethodLabel,
  getAdminPaymentStatusLabel,
} from '../../utils/adminFormatters.js';

const EMPTY_ADMIN_META = {
  editableBookingStatusOptions: [],
};

/**
 * Form xử lý booking hiện chỉ cần trạng thái, nên state của form được giữ tối giản.
 */
function createFormState(booking) {
  return {
    status: booking.status,
  };
}

/**
 * Chuẩn hóa timeline về mảng để JSX không phải kiểm tra null/undefined nhiều lần.
 */
function getBookingTimeline(bookingDetail) {
  return Array.isArray(bookingDetail?.timeline) ? bookingDetail.timeline : [];
}

/**
 * Chi tiết booking giúp admin xem tổng thể đơn đặt tour và cập nhật trạng thái vận hành.
 */
function AdminBookingDetailPage() {
  const { bookingCode } = useParams();
  const currentAdmin = getStoredAdminUser();
  const canDeleteBookings = hasAdminPermission(ADMIN_PERMISSION_KEYS.BOOKINGS_DELETE, currentAdmin);
  const [bookingDetail, setBookingDetail] = useState(null);
  const [adminMeta, setAdminMeta] = useState(EMPTY_ADMIN_META);
  const [formData, setFormData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    /**
     * Tải lại chi tiết mỗi khi đổi bookingCode để detail luôn đúng ngữ cảnh.
     */
    async function loadBookingDetail() {
      try {
        const [booking, meta] = await Promise.all([getAdminBookingDetail(bookingCode), getAdminMeta()]);
        setBookingDetail(booking);
        setFormData(createFormState(booking));
        setAdminMeta({
          editableBookingStatusOptions: meta.editableBookingStatusOptions ?? [],
        });
        setErrorMessage('');
        setSuccessMessage('');
      } catch (error) {
        setErrorMessage(error.message);
      }
    }

    loadBookingDetail();
  }, [bookingCode]);

  /**
   * Cập nhật state cho form xử lý booking.
   */
  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((currentFormData) => ({ ...currentFormData, [name]: value }));
  }

  /**
   * Lưu thay đổi trạng thái booking.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updatedBooking = await updateAdminBooking(bookingCode, formData);
      setBookingDetail(updatedBooking);
      setFormData(createFormState(updatedBooking));
      setSuccessMessage('Đã lưu cập nhật cho booking này.');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Đánh dấu xóa mềm booking ngay tại trang detail.
   */
  async function handleToggleDelete() {
    if (!canDeleteBookings) {
      return;
    }

    const shouldContinue = window.confirm('Bạn có chắc muốn xóa booking này không?');

    if (!shouldContinue) {
      return;
    }

    try {
      const updatedBooking = await toggleAdminBookingDeleteFlag(bookingCode);
      setBookingDetail(updatedBooking);
      setFormData(createFormState(updatedBooking));
      setSuccessMessage('Booking đã được xóa.');
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  if (errorMessage && !bookingDetail) {
    return (
      <section className="content-card admin-empty-state">
        <h2>Không tìm thấy booking</h2>
        <p>{errorMessage}</p>
        <Link className="button button-primary" to="/admin/bookings">
          Quay lại danh sách booking
        </Link>
      </section>
    );
  }

  if (!bookingDetail || !formData) {
    return <p className="helper-text">Đang tải chi tiết booking...</p>;
  }

  const bookingTimeline = getBookingTimeline(bookingDetail);

  return (
    <div className="page-stack">
      <section className="content-card">
        <div className="section-heading-row">
          <div>
            <p className="booking-id">{bookingDetail.id}</p>
            <h2>{bookingDetail.customerName}</h2>
            <p>{bookingDetail.tourTitle}</p>
          </div>

          <div className="admin-status-stack">
            <span className={getAdminBookingBadgeClass(bookingDetail.status, bookingDetail.deleteFlg)}>
              {bookingDetail.deleteFlg ? 'Đã xóa mềm' : getAdminBookingStatusLabel(bookingDetail.status)}
            </span>
            <span className={getAdminPaymentBadgeClass(bookingDetail.paymentStatus)}>
              {getAdminPaymentStatusLabel(bookingDetail.paymentStatus)}
            </span>
          </div>
        </div>
      </section>

      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
      {successMessage ? <p className="success-message">{successMessage}</p> : null}

      <div className="admin-detail-grid">
        <section className="content-card">
          <h2>Tổng quan đơn đặt tour</h2>
          <div className="admin-summary-grid">
            <article className="admin-mini-card">
              <span>Ngày tạo</span>
              <strong>{formatDateTime(bookingDetail.bookedAt)}</strong>
            </article>
            <article className="admin-mini-card">
              <span>Khởi hành</span>
              <strong>{formatDate(bookingDetail.departureDate)}</strong>
            </article>
            <article className="admin-mini-card">
              <span>Số khách</span>
              <strong>{bookingDetail.travelers}</strong>
            </article>
            <article className="admin-mini-card">
              <span>Tổng tiền</span>
              <strong>{formatCurrency(bookingDetail.totalPrice)}</strong>
            </article>
            <article className="admin-mini-card">
              <span>Khuyến mãi</span>
              <strong>{bookingDetail.promotionCode || 'Không áp dụng'}</strong>
            </article>
          </div>

          <div className="admin-list-stack">
            <article className="admin-mini-card">
              <span>Tạm tính / giảm giá</span>
              <strong>
                {formatCurrency(bookingDetail.subtotalPrice ?? bookingDetail.totalPrice)} / -{formatCurrency(bookingDetail.discountAmount ?? 0)}
              </strong>
            </article>
            <article className="admin-mini-card">
              <span>Khách hàng</span>
              <strong>{bookingDetail.customerEmail}</strong>
            </article>
            <article className="admin-mini-card">
              <span>Số điện thoại</span>
              <strong>{bookingDetail.customerPhone}</strong>
            </article>
            <article className="admin-mini-card">
              <span>Phương thức thanh toán</span>
              <strong>{bookingDetail.paymentMethod ? getAdminPaymentMethodLabel(bookingDetail.paymentMethod) : 'Chưa có dữ liệu'}</strong>
            </article>
          </div>

          {bookingDetail.notes ? (
            <div className="admin-profile-summary">
              <p>
                <strong>Ghi chú của khách:</strong> {bookingDetail.notes}
              </p>
            </div>
          ) : null}

          <div className="admin-topbar-actions">
            {bookingDetail.paymentCode ? (
              <Link className="button button-secondary" to={`/admin/payments/${bookingDetail.paymentCode}`}>
                Mở payment liên quan
              </Link>
            ) : null}
            <Link className="button button-secondary" to={`/admin/tours/${bookingDetail.tourId}/edit`}>
              Mở tour liên quan
            </Link>
          </div>
        </section>

        <section className="content-card">
          <form className="form-card" onSubmit={handleSubmit}>
            <h2>Cập nhật trạng thái xử lý</h2>
            <FormField
              as="select"
              label="Trạng thái booking"
              name="status"
              onChange={handleChange}
              options={adminMeta.editableBookingStatusOptions}
              value={formData.status}
            />

            <div className="admin-form-actions">
              <button className="button button-primary" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Đang lưu...' : 'Lưu cập nhật'}
              </button>
              {canDeleteBookings && !bookingDetail.deleteFlg ? (
                <button className="button button-danger" type="button" onClick={handleToggleDelete}>
                  Xóa
                </button>
              ) : null}
              <Link className="button button-secondary" to="/admin/bookings">
                Về danh sách
              </Link>
            </div>
          </form>
        </section>
      </div>

      <section className="content-card">
        <h2>Lịch sử thao tác</h2>
        {bookingTimeline.length ? (
          <div className="admin-activity-list">
            {bookingTimeline.map((activity) => (
              <article className="admin-activity-card" key={`${activity.time}-${activity.title}`}>
                <div className="timeline-dot" />
                <div>
                  <strong>{activity.title}</strong>
                  <p>{activity.detail}</p>
                  <span>{formatDateTime(activity.time)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-empty-state">
            <h3>Chưa có lịch sử thao tác</h3>
            <p>Khi booking được cập nhật bởi hệ thống hoặc nhân sự vận hành, lịch sử sẽ hiển thị tại đây.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminBookingDetailPage;
