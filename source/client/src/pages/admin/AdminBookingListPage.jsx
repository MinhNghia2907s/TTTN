import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionHeading from '../../components/SectionHeading.jsx';
import { ADMIN_PERMISSION_KEYS, getStoredAdminUser, hasAdminPermission } from '../../services/admin/adminAuthService.js';
import { getAdminMeta } from '../../services/admin/adminMetaService.js';
import { getAdminBookings, toggleAdminBookingDeleteFlag, updateAdminBooking } from '../../services/admin/adminBookingService.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import {
  formatDateTime,
  getAdminBookingBadgeClass,
  getAdminBookingStatusLabel,
  getAdminPaymentBadgeClass,
  getAdminPaymentStatusLabel,
} from '../../utils/adminFormatters.js';

const EMPTY_ADMIN_META = {
  bookingStatusOptions: [],
  paymentStatusOptions: [],
};

/**
 * Từ trạng thái booking hiện tại, xác định thao tác nhanh khả dụng ngay trên bảng.
 */
function getQuickBookingAction(status) {
  if (status === 'pending') {
    return { label: 'Xác nhận', nextStatus: 'confirmed' };
  }

  if (status === 'confirmed') {
    return { label: 'Hoàn tất', nextStatus: 'completed' };
  }

  return null;
}

/**
 * Lọc booking theo từ khóa, trạng thái booking và trạng thái payment.
 */
function filterBookings(bookingList, searchKeyword, statusFilter, paymentStatusFilter) {
  const normalizedKeyword = searchKeyword.trim().toLowerCase();

  return bookingList.filter((booking) => {
    const matchesKeyword =
      !normalizedKeyword ||
      booking.id.toLowerCase().includes(normalizedKeyword) ||
      booking.customerName.toLowerCase().includes(normalizedKeyword) ||
      booking.tourTitle.toLowerCase().includes(normalizedKeyword);
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesPaymentStatus = paymentStatusFilter === 'all' || booking.paymentStatus === paymentStatusFilter;

    return matchesKeyword && matchesStatus && matchesPaymentStatus;
  });
}

/**
 * Gom KPI booking để JSX chỉ cần render lại các số đã có ý nghĩa.
 */
function buildBookingSummary(filteredBookings) {
  const pendingBookings = filteredBookings.filter((booking) => booking.status === 'pending');
  const confirmedBookings = filteredBookings.filter((booking) => booking.status === 'confirmed');
  const completedBookings = filteredBookings.filter((booking) => booking.status === 'completed');
  const waitingPayments = filteredBookings.filter((booking) => booking.paymentStatus === 'waiting');

  return {
    completedBookings,
    confirmedBookings,
    grossValue: filteredBookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
    pendingBookings,
    softDeletedBookings: filteredBookings.filter((booking) => booking.deleteFlg),
    waitingPayments,
  };
}

/**
 * Danh sách booking cho admin theo dữ liệu thật, ưu tiên theo dõi pipeline vận hành.
 */
function AdminBookingListPage() {
  const currentAdmin = getStoredAdminUser();
  const canDeleteBookings = hasAdminPermission(ADMIN_PERMISSION_KEYS.BOOKINGS_DELETE, currentAdmin);
  const [bookingList, setBookingList] = useState([]);
  const [adminMeta, setAdminMeta] = useState(EMPTY_ADMIN_META);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  /**
   * Tải booking để cả bộ lọc, KPI và bảng chi tiết dùng chung một nguồn dữ liệu.
   */
  async function loadBookings() {
    setIsLoading(true);

    try {
      const [bookings, meta] = await Promise.all([getAdminBookings(), getAdminMeta()]);
      setBookingList(bookings);
      setAdminMeta({
        bookingStatusOptions: meta.bookingStatusOptions ?? [],
        paymentStatusOptions: meta.paymentStatusOptions ?? [],
      });
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Đổi nhanh trạng thái booking để đẩy tiến độ xử lý.
   */
  async function handleQuickStatusChange(booking) {
    const quickAction = getQuickBookingAction(booking.status);

    if (!quickAction) {
      return;
    }

    try {
      const updatedBooking = await updateAdminBooking(booking.id, {
        status: quickAction.nextStatus,
      });

      setBookingList((currentBookings) =>
        currentBookings.map((item) => (item.id === booking.id ? updatedBooking : item)),
      );
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  /**
   * Xóa mềm booking khỏi danh sách vận hành.
   */
  async function handleToggleDelete(booking) {
    const shouldContinue = window.confirm('Bạn có chắc muốn xóa booking này không?');

    if (!shouldContinue) {
      return;
    }

    try {
      const updatedBooking = await toggleAdminBookingDeleteFlag(booking.id);
      setBookingList((currentBookings) =>
        currentBookings.map((item) => (item.id === booking.id ? updatedBooking : item)),
      );
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  const filteredBookings = useMemo(
    () => filterBookings(bookingList, searchKeyword, statusFilter, paymentStatusFilter),
    [bookingList, paymentStatusFilter, searchKeyword, statusFilter],
  );

  const { completedBookings, confirmedBookings, grossValue, pendingBookings, softDeletedBookings, waitingPayments } =
    useMemo(() => buildBookingSummary(filteredBookings), [filteredBookings]);

  return (
    <div className="page-stack">
      <section className="admin-toolbar-card">
        <div className="admin-toolbar-head">
          <SectionHeading
            eyebrow="Booking"
            title="Điều phối booking, tiến độ xử lý và trạng thái thanh toán"
            description="Theo dõi các đơn chờ xác nhận, tình trạng thanh toán và giá trị booking để ưu tiên vận hành."
          />
          <button className="button button-secondary" type="button" onClick={loadBookings}>
            Tải lại dữ liệu
          </button>
        </div>

        <div className="admin-kpi-grid">
          <article className="admin-kpi-card">
            <span>Booking trong phạm vi đang xem</span>
            <strong>{filteredBookings.length}</strong>
            <div className="admin-kpi-meta">{bookingList.length} booking trong nguồn dữ liệu</div>
          </article>
          <article className="admin-kpi-card">
            <span>Chờ xác nhận</span>
            <strong>{pendingBookings.length}</strong>
            <div className="admin-kpi-meta">{waitingPayments.length} đơn còn chờ thanh toán</div>
          </article>
          <article className="admin-kpi-card">
            <span>Đã xác nhận</span>
            <strong>{confirmedBookings.length}</strong>
            <div className="admin-kpi-meta">{completedBookings.length} booking đã hoàn tất</div>
          </article>
          <article className="admin-kpi-card">
            <span>Giá trị booking</span>
            <strong>{formatCurrency(grossValue)}</strong>
            <div className="admin-kpi-meta">{softDeletedBookings.length} booking đang xóa mềm</div>
          </article>
        </div>
      </section>

      <section className="admin-toolbar-card">
        <div className="admin-toolbar-grid">
          <div>
            <h3>Bộ lọc vận hành</h3>
            <p>Lọc theo trạng thái booking hoặc thanh toán để xử lý chính xác từng nhóm nghiệp vụ.</p>
          </div>
          <div className="admin-results-meta">
            <span className="chip">{pendingBookings.length} pending</span>
            <span className="chip">{waitingPayments.length} waiting payment</span>
            <span className="chip">{completedBookings.length} completed</span>
          </div>
        </div>

        <div className="admin-filter-grid admin-filter-grid-wide">
          <label className="form-field">
            <span>Tìm theo mã booking, khách hàng hoặc tour</span>
            <input
              placeholder="Ví dụ: BK-2026-001 hoặc Nguyễn Minh Châu"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Trạng thái booking</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {adminMeta.bookingStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Trạng thái thanh toán</span>
            <select value={paymentStatusFilter} onChange={(event) => setPaymentStatusFilter(event.target.value)}>
              {adminMeta.paymentStatusOptions.map((option) => (
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
            <h2>Danh sách booking</h2>
            <p className="helper-text">Mở chi tiết để kiểm tra tiến trình xử lý, giao dịch liên quan và cập nhật trạng thái booking.</p>
          </div>
          <div className="admin-results-meta">
            <span className="chip">{filteredBookings.length} kết quả</span>
            <span className="chip">{formatCurrency(grossValue)}</span>
          </div>
        </div>

        {isLoading ? (
          <p className="helper-text">Đang tải danh sách booking...</p>
        ) : filteredBookings.length ? (
          <div className="admin-table-shell admin-table-shell-bookings">
            <table className="admin-table admin-table-bookings">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Tour / ngày đi</th>
                  <th>Số khách</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Cập nhật</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => {
                  // Chỉ những trạng thái còn nằm trên pipeline xử lý mới có quick action.
                  const quickAction = getQuickBookingAction(booking.status);

                  return (
                    <tr key={booking.id}>
                      <td data-label="Booking">
                        <div className="admin-table-user">
                          <strong>{booking.customerName}</strong>
                          <span>{booking.id}</span>
                          <p>{booking.customerEmail}</p>
                        </div>
                      </td>
                      <td data-label="Tour / ngày đi">
                        <div className="admin-table-meta">
                          <span>{booking.tourTitle}</span>
                          <span>Khởi hành {formatDate(booking.departureDate)}</span>
                        </div>
                      </td>
                      <td data-label="Số khách">{booking.travelers}</td>
                      <td data-label="Tổng tiền">
                        <div className="admin-table-meta">
                          <span>{formatCurrency(booking.totalPrice)}</span>
                          {booking.discountAmount ? <span>Giảm {formatCurrency(booking.discountAmount)}</span> : null}
                        </div>
                      </td>
                      <td data-label="Trạng thái">
                        <div className="admin-status-stack">
                          <span className={getAdminBookingBadgeClass(booking.status, booking.deleteFlg)}>
                            {booking.deleteFlg ? 'Đã xóa mềm' : getAdminBookingStatusLabel(booking.status)}
                          </span>
                          <span className={getAdminPaymentBadgeClass(booking.paymentStatus)}>
                            {getAdminPaymentStatusLabel(booking.paymentStatus)}
                          </span>
                        </div>
                      </td>
                      <td data-label="Cập nhật">{formatDateTime(booking.bookedAt)}</td>
                      <td data-label="Thao tác">
                        <div className="admin-table-actions">
                          <Link className="button button-secondary" to={`/admin/bookings/${booking.id}`}>
                            Chi tiết
                          </Link>
                          {quickAction ? (
                            <button className="button button-ghost" type="button" onClick={() => handleQuickStatusChange(booking)}>
                              {quickAction.label}
                            </button>
                          ) : null}
                          {canDeleteBookings && !booking.deleteFlg ? (
                            <button className="button button-danger" type="button" onClick={() => handleToggleDelete(booking)}>
                              Xóa
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-state">
            <h3>Không có booking nào phù hợp bộ lọc</h3>
            <p>Thử điều chỉnh trạng thái booking hoặc thanh toán để mở rộng phạm vi theo dõi.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminBookingListPage;
