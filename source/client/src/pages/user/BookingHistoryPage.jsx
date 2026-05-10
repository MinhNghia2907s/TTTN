import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BookingStatusPill from '../../components/BookingStatusPill.jsx';
import SectionHeading from '../../components/SectionHeading.jsx';
import { getBookings } from '../../services/user/bookingService.js';
import { logout } from '../../services/user/authService.js';
import { getTourDetail } from '../../services/user/tourService.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

function getBookingFilterStatus(booking) {
  if (booking.status === 'cancelled') {
    return 'cancelled';
  }

  return booking.paymentStatus === 'paid' ? 'paid' : 'waiting';
}

/**
 * Trang lịch sử booking, lấy danh sách booking thật của user và lọc nhanh theo trạng thái.
 */
function BookingHistoryPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [tourMap, setTourMap] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    /**
     * Lấy danh sách booking rồi dựng map tour tương ứng để card hiển thị được tên tour.
     */
    async function loadBookings() {
      try {
        const data = await getBookings();
        setBookings(data);

        const entries = await Promise.all(
          data.map(async (booking) => {
            const tour = await getTourDetail(booking.tourId);
            return [booking.tourId, tour];
          }),
        );

        setTourMap(Object.fromEntries(entries));
        setErrorMessage('');
      } catch (error) {
        if (error.status === 401) {
          logout();
          navigate('/login', { replace: true, state: { redirectTo: '/bookings' } });
          return;
        }

        setErrorMessage(error.message);
      }
    }

    loadBookings();
  }, [navigate]);

  // Giữ bộ lọc trạng thái ở client để người dùng đổi nhanh mà không cần gọi lại API.
  const filteredBookings = useMemo(() => {
    if (statusFilter === 'all') {
      return bookings;
    }

    return bookings.filter((booking) => getBookingFilterStatus(booking) === statusFilter);
  }, [bookings, statusFilter]);

  return (
    <div className="container page-stack">
      <section className="page-banner">
        <SectionHeading
          eyebrow="Lịch sử booking"
          title="Theo dõi các chuyến đi bạn đã giữ chỗ"
          description="Xem nhanh trạng thái thanh toán, ngày khởi hành và toàn bộ đơn đặt tour để chủ động sắp xếp kế hoạch trước mỗi chuyến đi."
        />
      </section>

      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

      <section className="filters-panel">
        <label className="form-field">
          <span>Lọc theo trạng thái</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Tất cả</option>
            <option value="waiting">Chờ thanh toán</option>
            <option value="paid">Đã thanh toán</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </label>
      </section>

      {filteredBookings.length ? (
        <section className="history-list">
          {filteredBookings.map((booking) => (
            <article className="history-card" key={booking.id}>
              <div>
                <p className="booking-id">{booking.id}</p>
                <h3>{tourMap[booking.tourId]?.title ?? 'Đang tải tên tour'}</h3>
                <p>
                  Khởi hành {formatDate(booking.departureDate)} | {booking.travelers} khách
                </p>
              </div>
              <div className="history-status">
                <BookingStatusPill paymentStatus={booking.paymentStatus} status={booking.status} />
                <strong>{formatCurrency(booking.totalPrice)}</strong>
              </div>
              <div className="history-actions">
                <Link className="button button-secondary" to={`/bookings/${booking.id}`}>
                  Xem chi tiết
                </Link>
                {booking.status !== 'cancelled' && booking.paymentStatus === 'waiting' ? (
                  <Link className="button button-primary" to={`/payment/${booking.id}`}>
                    Thanh toán ngay
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="empty-panel">
          <h2>Bạn chưa có booking nào</h2>
          <Link className="button button-primary" to="/tours">
            Khám phá tour
          </Link>
        </section>
      )}
    </div>
  );
}

export default BookingHistoryPage;
