import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import BookingStatusPill from '../../components/BookingStatusPill.jsx';
import BookingTimeline from '../../components/BookingTimeline.jsx';
import SectionHeading from '../../components/SectionHeading.jsx';
import { cancelBooking, getBookingDetail } from '../../services/user/bookingService.js';
import { logout } from '../../services/user/authService.js';
import { getTourDetail } from '../../services/user/tourService.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

/**
 * Trang chi tiết booking, hiển thị đủ thông tin đơn và cho phép hủy booking nếu backend còn cho phép.
 */
function BookingDetailPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [tour, setTour] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    /**
     * Lấy booking trước, sau đó mới lấy tour liên quan để tránh gọi thiếu dữ liệu.
     */
    async function loadBooking() {
      try {
        const bookingData = await getBookingDetail(bookingId);
        setBooking(bookingData);

        if (bookingData) {
          const tourData = await getTourDetail(bookingData.tourId);
          setTour(tourData);
        }

        setErrorMessage('');
      } catch (error) {
        if (error.status === 401) {
          logout();
          navigate('/login', { replace: true, state: { redirectTo: `/bookings/${bookingId}` } });
          return;
        }

        setErrorMessage(error.message);
      }
    }

    loadBooking();
  }, [bookingId, navigate]);

  /**
   * Hủy booking hiện tại rồi cập nhật lại toàn bộ thông tin đơn trên giao diện.
   */
  async function handleCancelBooking() {
    try {
      const updatedBooking = await cancelBooking(bookingId);
      setBooking(updatedBooking);
      setSuccessMessage('Booking đã được hủy thành công.');
      setErrorMessage('');
    } catch (error) {
      if (error.status === 401) {
        logout();
        navigate('/login', { replace: true, state: { redirectTo: `/bookings/${bookingId}` } });
        return;
      }

      setErrorMessage(error.message);
    }
  }

  if (!booking) {
    return (
      <div className="container empty-panel">
        <h2>{errorMessage || 'Đang tải chi tiết booking'}</h2>
        <Link className="button button-primary" to="/bookings">
          Quay lại lịch sử
        </Link>
      </div>
    );
  }

  return (
    <div className="container page-stack">
      <section className="page-banner">
        <p className="section-eyebrow">Chi tiết booking</p>
        <h1>{booking.id}</h1>
        <BookingStatusPill paymentStatus={booking.paymentStatus} status={booking.status} />
      </section>

      {successMessage ? <p className="success-message">{successMessage}</p> : null}
      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

      <div className="detail-grid">
        <section className="content-card">
          <SectionHeading
            eyebrow="Thông tin chung"
            title={tour?.title ?? 'Đang tải tên tour'}
            description="Toàn bộ thông tin giữ chỗ, thanh toán và liên hệ của đơn đặt tour được tổng hợp tại đây để bạn tiện theo dõi."
          />
          <ul className="detail-list">
            <li>Ngày đặt: {formatDate(booking.bookedAt)}</li>
            <li>Ngày khởi hành: {formatDate(booking.departureDate)}</li>
            <li>Số hành khách: {booking.travelers}</li>
            <li>Phương thức thanh toán: {booking.paymentMethod}</li>
            <li>Tạm tính: {formatCurrency(booking.subtotalPrice ?? booking.totalPrice)}</li>
            <li>Khuyến mãi: {booking.promotionCode ? `${booking.promotionCode} - ` : ''}{formatCurrency(booking.discountAmount ?? 0)}</li>
            <li>Tổng tiền: {formatCurrency(booking.totalPrice)}</li>
            <li>Ghi chú: {booking.notes}</li>
          </ul>
        </section>

        <aside className="summary-card">
          <p className="section-eyebrow">Thông tin liên hệ</p>
          <h2>{booking.customerName}</h2>
          <ul className="detail-list">
            <li>Email: {booking.customerEmail}</li>
            <li>Điện thoại: {booking.customerPhone}</li>
          </ul>
          <div className="history-actions">
            <Link className="button button-secondary" to="/bookings">
              Quay lại lịch sử
            </Link>
            {booking.status !== 'cancelled' && booking.paymentStatus === 'waiting' ? (
              <Link className="button button-primary" to={`/payment/${booking.id}`}>
                Thanh toán ngay
              </Link>
            ) : null}
            {booking.status !== 'cancelled' && booking.status !== 'completed' ? (
              <button className="button button-ghost" type="button" onClick={handleCancelBooking}>
                Hủy booking
              </button>
            ) : null}
          </div>
        </aside>
      </div>

      <section className="content-card">
        <SectionHeading
          eyebrow="Tiến trình xử lý"
          title="Hành trình xác nhận đơn đặt tour"
          description="Các mốc quan trọng sẽ được cập nhật liên tục để bạn biết đơn đang ở bước nào trước ngày khởi hành."
        />
        <BookingTimeline items={booking.timeline} />
      </section>
    </div>
  );
}

export default BookingDetailPage;
