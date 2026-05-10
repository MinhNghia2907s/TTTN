import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import BookingStatusPill from '../../components/BookingStatusPill.jsx';
import { logout } from '../../services/user/authService.js';
import { getPaymentDetail, payBooking, syncPaymentStatus } from '../../services/user/paymentService.js';
import {
  formatCurrency,
  formatDate,
  getPayosStatusLabel,
  getPayosStatusTone,
} from '../../utils/formatters.js';

function isImageSource(value) {
  return /^data:image\//.test(value) || /^https?:\/\//.test(value);
}

function PaymentPage() {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const payosResult = searchParams.get('payos');
  const [booking, setBooking] = useState(null);
  const [tour, setTour] = useState(null);
  const [payment, setPayment] = useState(null);
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    async function loadPaymentData() {
      setIsSyncing(payosResult === 'return');

      try {
        const result =
          payosResult === 'return'
            ? await syncPaymentStatus(bookingId)
            : await getPaymentDetail(bookingId);

        setBooking(result.booking);
        setTour(result.tour);
        setPayment(result.payment);
        setErrorMessage('');

        if (payosResult === 'return') {
          setSuccessMessage(
            result.booking?.paymentStatus === 'paid'
              ? 'PayOS đã xác nhận thanh toán thành công.'
              : 'Thanh toán đang chờ PayOS xác nhận. Bạn có thể tải lại trạng thái sau ít phút.',
          );
        } else if (payosResult === 'cancel') {
          setSuccessMessage('');
          setErrorMessage('Bạn đã hủy phiên thanh toán PayOS. Booking vẫn đang chờ thanh toán.');
        }
      } catch (error) {
        if (error.status === 401) {
          logout();
          navigate('/login', { replace: true, state: { redirectTo: `/payment/${bookingId}` } });
          return;
        }

        setErrorMessage(error.message);
      } finally {
        setIsSyncing(false);
      }
    }

    loadPaymentData();
  }, [bookingId, navigate, payosResult]);

  useEffect(() => {
    let isActive = true;

    /**
     * PayOS có thể trả qrCode là ảnh hoặc chuỗi VietQR. Nếu là chuỗi, frontend tự render thành ảnh QR.
     */
    async function renderQrImage() {
      if (!payment?.qrCode) {
        setQrImageUrl('');
        return;
      }

      try {
        const nextQrImageUrl = isImageSource(payment.qrCode)
          ? payment.qrCode
          : await QRCode.toDataURL(payment.qrCode, {
              errorCorrectionLevel: 'M',
              margin: 2,
              scale: 8,
            });

        if (isActive) {
          setQrImageUrl(nextQrImageUrl);
        }
      } catch (error) {
        if (isActive) {
          setQrImageUrl('');
          setErrorMessage('Không thể hiển thị mã QR PayOS. Bạn có thể mở trang PayOS để thanh toán.');
        }
      }
    }

    renderQrImage();

    return () => {
      isActive = false;
    };
  }, [payment?.qrCode]);

  const draftSummary = useMemo(() => {
    return {
      customerName: booking?.customerName || 'Đang cập nhật',
      departureDate: booking?.departureDate || '',
      discountAmount: booking?.discountAmount || 0,
      paymentStatus: booking?.paymentStatus || 'waiting',
      promotionCode: booking?.promotionCode || null,
      status: booking?.status || 'pending',
      subtotalPrice: booking?.subtotalPrice || booking?.totalPrice || 0,
      totalPrice: booking?.totalPrice || 0,
      travelers: booking?.travelers || 0,
    };
  }, [booking]);

  async function handleCreatePayosPayment() {
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await payBooking({ bookingId });

      setBooking(result.booking);
      setPayment(result.payment);
      setTour(result.tour);
      setSuccessMessage('Đã tạo mã QR PayOS. Vui lòng quét mã để thanh toán.');
    } catch (error) {
      if (error.status === 401) {
        logout();
        navigate('/login', { replace: true, state: { redirectTo: `/payment/${bookingId}` } });
        return;
      }

      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Dùng khi test local không có webhook public, hoặc khi user muốn kiểm tra lại sau khi quét QR.
   */
  async function handleSyncPaymentStatus() {
    setIsSyncing(true);
    setErrorMessage('');

    try {
      const result = await syncPaymentStatus(bookingId);
      setBooking(result.booking);
      setPayment(result.payment);
      setTour(result.tour);
      setSuccessMessage(
        result.booking?.paymentStatus === 'paid'
          ? 'PayOS đã xác nhận thanh toán thành công.'
          : 'Giao dịch vẫn đang chờ xác nhận từ PayOS.',
      );
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSyncing(false);
    }
  }

  if (!booking || !tour) {
    return (
      <div className="container empty-panel">
        <h2>{errorMessage || 'Đang tải thông tin thanh toán'}</h2>
        <Link className="button button-primary" to="/bookings">
          Quay lại lịch sử booking
        </Link>
      </div>
    );
  }

  const isPaid = booking.paymentStatus === 'paid';
  const isCancelled = booking.status === 'cancelled';
  const hasCheckoutUrl = Boolean(payment?.checkoutUrl);
  const hasPayosSession = Boolean(payment?.providerOrderCode);
  const payosStatus = isCancelled ? 'CANCELLED' : payment?.providerStatus || (isPaid ? 'PAID' : '');

  return (
    <div className="container page-stack">
      <section className="page-banner">
        <p className="section-eyebrow">Trang thanh toán</p>
        <h1>Hoàn tất thanh toán qua PayOS để khóa chỗ chính thức.</h1>
      </section>

      <div className="booking-grid">
        <section className="form-card">
          <div>
            <p className="section-eyebrow">PayOS QR</p>
            <h2>
              {isCancelled
                ? 'Booking đã hủy'
                : isPaid
                  ? 'Thanh toán đã hoàn tất'
                  : 'Quét mã để thanh toán'}
            </h2>
            <p className="helper-text">
              {isCancelled
                ? 'Booking này đã bị hủy nên không thể tạo hoặc tiếp tục phiên thanh toán.'
                : 'Booking chỉ được xác nhận sau khi PayOS gửi webhook hoặc API đồng bộ trả về trạng thái thành công.'}
            </p>
          </div>

          <div className="payos-status-panel">
            <span>Trạng thái PayOS</span>
            <strong className={`payos-status-text payos-status-${getPayosStatusTone(payosStatus)}`}>
              {getPayosStatusLabel(payosStatus) || 'Chưa tạo phiên'}
            </strong>
            {payment?.providerOrderCode ? <p>Mã thanh toán: {payment.providerOrderCode}</p> : null}
          </div>

          {!isPaid && !isCancelled && qrImageUrl ? (
            <div className="payos-qr-panel">
              <img alt="Mã QR thanh toán PayOS" src={qrImageUrl} />
              <p>Quét mã bằng ứng dụng ngân hàng hoặc ví điện tử hỗ trợ VietQR.</p>
            </div>
          ) : null}

          {isPaid || isCancelled ? (
            <Link className="button button-primary full-width" to="/bookings">
              Xem lịch sử booking
            </Link>
          ) : (
            <>
              <button
                className="button button-primary full-width"
                disabled={isSubmitting}
                type="button"
                onClick={handleCreatePayosPayment}
              >
                {isSubmitting
                  ? 'Đang tạo mã QR PayOS...'
                  : hasPayosSession
                    ? 'Tạo lại mã QR PayOS'
                    : 'Tạo mã QR PayOS'}
              </button>

              {hasCheckoutUrl ? (
                <a className="button button-secondary full-width" href={payment.checkoutUrl}>
                  Mở trang PayOS
                </a>
              ) : null}

              <button
                className="button button-ghost full-width"
                disabled={isSyncing || !payment?.providerOrderCode}
                type="button"
                onClick={handleSyncPaymentStatus}
              >
                {isSyncing ? 'Đang đồng bộ...' : 'Tải lại trạng thái thanh toán'}
              </button>
            </>
          )}

          {successMessage ? <p className="success-message">{successMessage}</p> : null}
          {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
        </section>

        <aside className="summary-card">
          <p className="section-eyebrow">Đơn hàng</p>
          <h2>{tour.title}</h2>
          <BookingStatusPill paymentStatus={draftSummary.paymentStatus} status={draftSummary.status} />
          <ul className="detail-list">
            <li>Mã booking: {booking.id}</li>
            <li>Khách hàng: {draftSummary.customerName}</li>
            <li>Số khách: {draftSummary.travelers}</li>
            <li>
              Ngày khởi hành:{' '}
              {draftSummary.departureDate ? formatDate(draftSummary.departureDate) : 'Đang cập nhật'}
            </li>
            <li>Phương thức gần nhất: {payment?.method || booking.paymentMethod}</li>
          </ul>
          <div className="summary-total summary-total-muted">
            <span>Tạm tính</span>
            <strong>{formatCurrency(draftSummary.subtotalPrice)}</strong>
          </div>
          <div className="summary-total summary-total-muted">
            <span>Khuyến mãi{draftSummary.promotionCode ? ` (${draftSummary.promotionCode})` : ''}</span>
            <strong>-{formatCurrency(draftSummary.discountAmount)}</strong>
          </div>
          <div className="summary-total">
            <span>Tổng thanh toán</span>
            <strong>{formatCurrency(draftSummary.totalPrice)}</strong>
          </div>
          <p className="helper-text">
            Sau khi thanh toán thành công, bạn có thể xem lại trạng thái đơn và thông tin chuyến đi
            trong mục lịch sử booking.
          </p>
          <div className="inline-links">
            <Link to="/bookings">Xem lịch sử booking</Link>
            <Link to={`/tours/${tour.id}`}>Quay lại chi tiết tour</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default PaymentPage;
