import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import FormField from '../../components/FormField.jsx';
import { ADMIN_PERMISSION_KEYS, getStoredAdminUser, hasAdminPermission } from '../../services/admin/adminAuthService.js';
import { getAdminMeta } from '../../services/admin/adminMetaService.js';
import { getAdminPaymentDetail, refundAdminPayment, updateAdminPayment } from '../../services/admin/adminPaymentService.js';
import { formatCurrency } from '../../utils/formatters.js';
import {
  formatDateTime,
  getAdminPaymentBadgeClass,
  getAdminPaymentMethodLabel,
  getAdminPaymentStatusLabel,
} from '../../utils/adminFormatters.js';

/**
 * Form cập nhật payment chỉ hỗ trợ các trạng thái backend cho phép sửa trực tiếp
 * (`waiting`, `paid`, `failed`). Khi payment đã `refunded`, UI vẫn hiển thị trạng thái
 * hiện tại ở phần tổng quan, nhưng dropdown chỉnh sửa quay về `paid` để không sinh ra
 * một lựa chọn không hợp lệ cho API update thường.
 */
function createFormState(payment) {
  return {
    status: payment.status === 'refunded' ? 'paid' : payment.status,
  };
}

/**
 * Trang chi tiết payment để admin đổi trạng thái hoặc hoàn tiền.
 */
function AdminPaymentDetailPage() {
  const { paymentCode } = useParams();
  const currentAdmin = getStoredAdminUser();
  const canRefundPayments = hasAdminPermission(ADMIN_PERMISSION_KEYS.PAYMENTS_REFUND, currentAdmin);
  const [paymentDetail, setPaymentDetail] = useState(null);
  const [adminMeta, setAdminMeta] = useState({
    paymentStatusOptions: [],
  });
  const [formData, setFormData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    /**
     * Tải chi tiết payment để form luôn bám đúng giao dịch đang được quản lý.
     */
    async function loadPaymentDetail() {
      try {
        const [payment, meta] = await Promise.all([getAdminPaymentDetail(paymentCode), getAdminMeta()]);
        setPaymentDetail(payment);
        setFormData(createFormState(payment));
        setAdminMeta({
          paymentStatusOptions: meta.paymentStatusOptions ?? [],
        });
        setErrorMessage('');
        setSuccessMessage('');
      } catch (error) {
        setErrorMessage(error.message);
      }
    }

    loadPaymentDetail();
  }, [paymentCode]);

  /**
   * Cập nhật state cho form chi tiết payment.
   */
  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((currentFormData) => ({ ...currentFormData, [name]: value }));
  }

  /**
   * Lưu trạng thái payment vào backend.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updatedPayment = await updateAdminPayment(paymentCode, formData);
      setPaymentDetail(updatedPayment);
      setFormData(createFormState(updatedPayment));
      setSuccessMessage('Đã lưu cập nhật cho payment này.');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Hoàn tiền payment đã thanh toán.
   */
  async function handleRefund() {
    if (!canRefundPayments) {
      return;
    }

    try {
      const updatedPayment = await refundAdminPayment(paymentCode);
      setPaymentDetail(updatedPayment);
      setFormData(createFormState(updatedPayment));
      setSuccessMessage('Đã hoàn tiền cho payment này.');
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  const paymentTimeline = useMemo(() => {
    if (!paymentDetail) {
      return [];
    }

    /**
     * Payment hiện chưa có timeline riêng ở backend như booking,
     * nên trang detail dựng timeline ngắn từ các mốc dữ liệu sẵn có
     * (`createdAt`, `paidAt`) để admin vẫn nhìn được diễn biến chính.
     */
    return [
      {
        detail: `Payment được tạo cho booking ${paymentDetail.bookingCode}.`,
        time: paymentDetail.createdAt,
        title: 'Khởi tạo giao dịch',
      },
      paymentDetail.paidAt
        ? {
            detail: `Giao dịch được ghi nhận ở trạng thái ${getAdminPaymentStatusLabel(paymentDetail.status).toLowerCase()}.`,
            time: paymentDetail.paidAt,
            title: paymentDetail.status === 'refunded' ? 'Hoàn tiền' : 'Cập nhật thanh toán',
          }
        : null,
    ].filter(Boolean);
  }, [paymentDetail]);

  /**
   * API update payment không nhận `all` và `refunded`.
   * `refunded` được xử lý qua action riêng "Hoàn tiền" để backend đồng bộ thêm booking.
   */
  const editablePaymentStatusOptions = adminMeta.paymentStatusOptions.filter(
    (option) => option.value !== 'all' && option.value !== 'refunded',
  );

  if (errorMessage && !paymentDetail) {
    return (
      <section className="content-card admin-empty-state">
        <h2>Không tìm thấy payment</h2>
        <p>{errorMessage}</p>
        <Link className="button button-primary" to="/admin/payments">
          Quay lại danh sách payment
        </Link>
      </section>
    );
  }

  if (!paymentDetail || !formData) {
    return <p className="helper-text">Đang tải chi tiết payment...</p>;
  }

  return (
    <div className="page-stack">
      <section className="content-card">
        <div className="section-heading-row">
          <div>
            <p className="booking-id">{paymentDetail.id}</p>
            <h2>{paymentDetail.customerName}</h2>
            <p>{paymentDetail.tourTitle}</p>
          </div>

          <span className={getAdminPaymentBadgeClass(paymentDetail.status)}>
            {getAdminPaymentStatusLabel(paymentDetail.status)}
          </span>
        </div>
      </section>

      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
      {successMessage ? <p className="success-message">{successMessage}</p> : null}

      <div className="admin-detail-grid">
        <section className="content-card">
          <h2>Tổng quan thanh toán</h2>
          <div className="admin-summary-grid">
            <article className="admin-mini-card">
              <span>Số tiền</span>
              <strong>{formatCurrency(paymentDetail.amount)}</strong>
            </article>
            <article className="admin-mini-card">
              <span>Trạng thái</span>
              <strong>{getAdminPaymentStatusLabel(paymentDetail.status)}</strong>
            </article>
            <article className="admin-mini-card">
              <span>Phương thức</span>
              <strong>{getAdminPaymentMethodLabel(paymentDetail.method)}</strong>
            </article>
            <article className="admin-mini-card">
              <span>Mã booking</span>
              <strong>{paymentDetail.bookingCode}</strong>
            </article>
          </div>

          <div className="admin-list-stack">
            <article className="admin-mini-card">
              <span>Tạo payment lúc</span>
              <strong>{formatDateTime(paymentDetail.createdAt)}</strong>
            </article>
            <article className="admin-mini-card">
              <span>Ghi nhận thanh toán</span>
              <strong>{formatDateTime(paymentDetail.paidAt)}</strong>
            </article>
            <article className="admin-mini-card">
              <span>Thông tin thẻ</span>
              <strong>
                {paymentDetail.cardName ? `${paymentDetail.cardName} •••• ${paymentDetail.cardLast4 || '--'}` : 'Không có dữ liệu'}
              </strong>
            </article>
          </div>

          <div className="admin-topbar-actions">
            <Link className="button button-secondary" to={`/admin/bookings/${paymentDetail.bookingCode}`}>
              Mở booking liên quan
            </Link>
          </div>
        </section>

        <section className="content-card">
          <form className="form-card" onSubmit={handleSubmit}>
            <h2>Cập nhật trạng thái giao dịch</h2>
            <FormField
              as="select"
              label="Trạng thái thanh toán"
              name="status"
              onChange={handleChange}
              options={editablePaymentStatusOptions}
              value={formData.status}
            />

            <div className="admin-form-actions">
              <button className="button button-primary" disabled={isSubmitting || paymentDetail.status === 'refunded'} type="submit">
                {isSubmitting ? 'Đang lưu...' : 'Lưu cập nhật'}
              </button>
              {canRefundPayments && paymentDetail.status === 'paid' ? (
                <button className="button button-warning" type="button" onClick={handleRefund}>
                  Hoàn tiền
                </button>
              ) : null}
              <Link className="button button-secondary" to="/admin/payments">
                Về danh sách
              </Link>
            </div>
          </form>
        </section>
      </div>

      <section className="content-card">
        <h2>Diễn biến giao dịch</h2>
        <div className="admin-activity-list">
          {paymentTimeline.map((activity) => (
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
      </section>
    </div>
  );
}

export default AdminPaymentDetailPage;
