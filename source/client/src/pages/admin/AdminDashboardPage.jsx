import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminBarChart from '../../components/AdminBarChart.jsx';
import AdminDonutChart from '../../components/AdminDonutChart.jsx';
import AdminHorizontalBarChart from '../../components/AdminHorizontalBarChart.jsx';
import SectionHeading from '../../components/SectionHeading.jsx';
import { getAdminBookings } from '../../services/admin/adminBookingService.js';
import { getAdminPayments } from '../../services/admin/adminPaymentService.js';
import { getAdminTours } from '../../services/admin/adminTourService.js';
import { getAdminUsers } from '../../services/admin/adminUserService.js';
import { formatCurrency } from '../../utils/formatters.js';
import {
  formatDateTime,
  getAdminBookingBadgeClass,
  getAdminBookingStatusLabel,
  getAdminPaymentBadgeClass,
  getAdminPaymentMethodLabel,
  getAdminPaymentStatusLabel,
  getAdminRoleLabel,
  getAdminUserBadgeClass,
  getAdminUserStatusLabel,
} from '../../utils/adminFormatters.js';

const bookingChartColors = {
  pending: '#ffbe5c',
  confirmed: '#ef7b45',
  completed: '#2767ad',
  cancelled: '#bf4757',
};

const paymentChartColors = {
  waiting: '#ffbe5c',
  paid: '#2d8f7b',
  refunded: '#2767ad',
  failed: '#bf4757',
};

const categoryChartColors = ['#10233c', '#ef7b45', '#2d8f7b', '#8d59c4', '#bf4757', '#9b6400'];
const BOOKING_CHART_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
const PAYMENT_CHART_STATUSES = ['waiting', 'paid', 'refunded', 'failed'];

/**
 * Sắp xếp bản ghi theo mốc thời gian mới nhất để tạo các khối "gần đây".
 */
function sortByLatest(items, keyName) {
  return [...items].sort((firstItem, secondItem) => new Date(secondItem[keyName]) - new Date(firstItem[keyName]));
}

/**
 * Tạo dữ liệu biểu đồ trạng thái booking từ danh sách booking thật.
 */
function buildBookingStatusChart(bookings) {
  return BOOKING_CHART_STATUSES.map((status) => ({
    color: bookingChartColors[status],
    label: getAdminBookingStatusLabel(status),
    shortLabel: getAdminBookingStatusLabel(status).split(' ')[0],
    value: bookings.filter((booking) => booking.status === status && !booking.deleteFlg).length,
  }));
}

/**
 * Tạo dữ liệu biểu đồ trạng thái payment từ danh sách payment thật.
 */
function buildPaymentStatusChart(payments) {
  return PAYMENT_CHART_STATUSES.map((status) => ({
    color: paymentChartColors[status],
    label: getAdminPaymentStatusLabel(status),
    value: payments.filter((payment) => payment.status === status).length,
  }));
}

/**
 * Nhóm tour theo category để hiển thị cơ cấu danh mục trên dashboard.
 */
function buildCategoryChart(tours) {
  return [...new Set(tours.map((tour) => tour.category).filter(Boolean))]
    .sort()
    .map((category, index) => ({
      color: categoryChartColors[index % categoryChartColors.length],
      label: category,
      value: tours.filter((tour) => tour.category === category && !tour.deleteFlg).length,
    }));
}

/**
 * Gom toàn bộ KPI và danh sách cảnh báo từ dữ liệu dashboard.
 * Tách riêng helper này giúp JSX chỉ còn nhiệm vụ hiển thị.
 */
function buildDashboardSummary(users, tours, bookings, payments) {
  const activeUsers = users.filter((user) => user.status === 'active' && !user.deleteFlg);
  const attentionUsers = users.filter((user) => user.status !== 'active' || user.deleteFlg);
  const publishedTours = tours.filter((tour) => tour.status === 'published' && !tour.deleteFlg);
  const archivedTours = tours.filter((tour) => tour.status === 'archived' || tour.deleteFlg);
  const waitingPayments = payments.filter((payment) => payment.status === 'waiting');
  const paidPayments = payments.filter((payment) => payment.status === 'paid');
  const pendingBookings = bookings.filter((booking) => booking.status === 'pending');
  const lowCapacityTours = tours
    .filter((tour) => !tour.deleteFlg && tour.totalDepartures > 0 && tour.remainingSeats <= 10)
    .slice(0, 4);

  return {
    activeUsers,
    archivedTours,
    attentionUsers,
    lowCapacityTours,
    paidPayments,
    paidRevenue: paidPayments.reduce((totalAmount, payment) => totalAmount + payment.amount, 0),
    pendingBookings,
    pendingRevenue: pendingBookings.reduce((totalAmount, booking) => totalAmount + booking.totalPrice, 0),
    publishedTours,
    recentBookings: sortByLatest(bookings, 'bookedAt').slice(0, 4),
    recentPayments: sortByLatest(payments, 'createdAt').slice(0, 4),
    recentUsers: sortByLatest(users, 'updatedAt').slice(0, 4),
    waitingPayments,
  };
}

/**
 * Dashboard quản trị hiển thị nhanh các KPI và nhóm việc cần xử lý từ dữ liệu thật.
 */
function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    /**
     * Tải song song toàn bộ dữ liệu để dashboard luôn tính KPI từ cùng một thời điểm.
     */
    async function loadDashboardData() {
      try {
        const [users, tours, bookings, payments] = await Promise.all([
          getAdminUsers(),
          getAdminTours(),
          getAdminBookings(),
          getAdminPayments(),
        ]);

        setDashboardData({
          bookings,
          payments,
          tours,
          users,
        });
        setErrorMessage('');
      } catch (error) {
        setErrorMessage(error.message);
      }
    }

    loadDashboardData();
  }, []);

  const users = dashboardData?.users ?? [];
  const tours = dashboardData?.tours ?? [];
  const bookings = dashboardData?.bookings ?? [];
  const payments = dashboardData?.payments ?? [];

  const {
    activeUsers,
    archivedTours,
    attentionUsers,
    lowCapacityTours,
    paidPayments,
    paidRevenue,
    pendingBookings,
    pendingRevenue,
    publishedTours,
    recentBookings,
    recentPayments,
    recentUsers,
    waitingPayments,
  } = useMemo(() => buildDashboardSummary(users, tours, bookings, payments), [users, tours, bookings, payments]);

  const bookingStatusChart = useMemo(() => buildBookingStatusChart(bookings), [bookings]);

  const paymentStatusChart = useMemo(() => buildPaymentStatusChart(payments), [payments]);

  const categoryChart = useMemo(() => buildCategoryChart(tours), [tours]);

  return (
    <div className="page-stack">
      <section className="admin-report-hero admin-hero-card">
        <div className="admin-report-hero-copy">
          <SectionHeading
            eyebrow="Bảng điều khiển"
            title="Điều hành tổng quan người dùng, tour, booking và thanh toán"
            description="Tập trung các chỉ số trọng yếu để rà soát tình trạng hệ thống và ưu tiên xử lý đúng đầu việc."
            action={
              <div className="admin-topbar-actions">
                <Link className="button button-primary" to="/admin/bookings">
                  Xử lý booking
                </Link>
                <Link className="button button-secondary" to="/admin/tours">
                  Điều phối tour
                </Link>
              </div>
            }
          />
        </div>

        <div className="admin-score-strip">
          <span className="admin-score-chip">
            <strong>{attentionUsers.length}</strong>
            <span>Tài khoản cần theo dõi</span>
          </span>
          <span className="admin-score-chip">
            <strong>{waitingPayments.length}</strong>
            <span>Giao dịch chờ đối soát</span>
          </span>
          <span className="admin-score-chip">
            <strong>{lowCapacityTours.length}</strong>
            <span>Tour sắp kín chỗ</span>
          </span>
        </div>
      </section>

      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

      <section className="admin-kpi-grid">
        <article className="admin-kpi-card">
          <span>Người dùng hoạt động</span>
          <strong>{activeUsers.length || '--'}</strong>
          <div className="admin-kpi-meta">{users.length} tài khoản trong hệ thống</div>
        </article>
        <article className="admin-kpi-card">
          <span>Tour đang mở bán</span>
          <strong>{publishedTours.length || '--'}</strong>
          <div className="admin-kpi-meta">{archivedTours.length} tour tạm ẩn hoặc xóa mềm</div>
        </article>
        <article className="admin-kpi-card">
          <span>Doanh thu đã ghi nhận</span>
          <strong>{dashboardData ? formatCurrency(paidRevenue) : '--'}</strong>
          <div className="admin-kpi-meta">{paidPayments.length} giao dịch đã thu</div>
        </article>
        <article className="admin-kpi-card">
          <span>Booking chờ xử lý</span>
          <strong>{pendingBookings.length || '--'}</strong>
          <div className="admin-kpi-meta">{formatCurrency(pendingRevenue)} đang ở hàng chờ</div>
        </article>
      </section>

      <section className="admin-report-grid">
        <article className="admin-report-card">
          <div className="admin-report-head">
            <div>
              <h3>Phân bổ trạng thái booking</h3>
              <p>Cho biết nhóm booking nào đang chiếm khối lượng xử lý lớn trong ngày.</p>
            </div>
            <Link className="button button-secondary" to="/admin/bookings">
              Mở booking
            </Link>
          </div>
          <AdminBarChart items={bookingStatusChart} />
        </article>

        <article className="admin-report-card">
          <div className="admin-report-head">
            <div>
              <h3>Tỷ trọng thanh toán</h3>
              <p>Cho biết cơ cấu giao dịch theo trạng thái thu tiền, chờ xử lý và hoàn tiền.</p>
            </div>
            <Link className="button button-secondary" to="/admin/payments">
              Mở payment
            </Link>
          </div>
          <AdminDonutChart centerLabel="Payment" items={paymentStatusChart} />
        </article>

        <article className="admin-report-card admin-report-card-wide">
          <div className="admin-report-head">
            <div>
              <h3>Danh mục tour theo nhóm</h3>
              <p>Hỗ trợ rà soát cơ cấu danh mục tour đang vận hành theo từng nhóm sản phẩm.</p>
            </div>
            <Link className="button button-secondary" to="/admin/tours">
              Mở tour
            </Link>
          </div>
          <AdminHorizontalBarChart items={categoryChart} />
        </article>
      </section>

      <section className="admin-insight-grid">
        <article className="admin-insight-card">
          <div className="admin-report-head">
            <div>
              <h2>Việc cần chú ý hôm nay</h2>
              <p>Các tín hiệu ưu tiên được tổng hợp trực tiếp từ dữ liệu vận hành hiện tại.</p>
            </div>
          </div>

          <div className="admin-insight-list">
            <article className="admin-insight-item">
              <strong>Ưu tiên booking chờ xác nhận</strong>
              <p>Hiện có {pendingBookings.length} booking đang chờ xác nhận để chuyển sang bước phục vụ tiếp theo.</p>
            </article>
            <article className="admin-insight-item">
              <strong>Đối soát giao dịch chờ thanh toán</strong>
              <p>Có {waitingPayments.length} giao dịch đang chờ đối soát và cần kiểm tra với khách hàng hoặc cổng thanh toán.</p>
            </article>
            <article className="admin-insight-item">
              <strong>Rà soát tài khoản cần theo dõi</strong>
              <p>{attentionUsers.length} tài khoản đang tạm ngưng, bị khóa hoặc xóa mềm cần được rà soát trạng thái.</p>
            </article>
          </div>
        </article>

        <article className="admin-insight-card">
          <div className="admin-report-head">
            <div>
              <h2>Tour cần kiểm tra chỗ</h2>
              <p>Các tour có quỹ chỗ thấp để đội vận hành chủ động điều phối kỳ khởi hành.</p>
            </div>
          </div>

          <div className="admin-list-stack">
            {lowCapacityTours.length ? (
              lowCapacityTours.map((tour) => (
                <article className="admin-list-item" key={tour.id}>
                  <div>
                    <strong>{tour.title}</strong>
                    <p className="helper-text">{tour.location}</p>
                  </div>
                  <div className="admin-list-item-side">
                    <span className="chip">{tour.openDepartures}/{tour.totalDepartures} đợt mở</span>
                    <span className="chip">Còn {tour.remainingSeats} chỗ</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="admin-empty-state">
                <h3>Chưa có tour nào chạm ngưỡng cảnh báo</h3>
                <p>Khi quỹ chỗ khả dụng giảm xuống ngưỡng cảnh báo, danh sách này sẽ tự hiển thị để theo dõi.</p>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="admin-highlight-grid">
        <article className="admin-report-card">
          <div className="admin-report-head">
            <div>
              <h3>Booking gần đây</h3>
              <p>Truy cập nhanh các booking mới phát sinh để tiếp nhận và xử lý.</p>
            </div>
          </div>

          <div className="admin-list-stack">
            {recentBookings.map((booking) => (
              <article className="admin-list-item" key={booking.id}>
                <div>
                  <strong>{booking.id}</strong>
                  <p className="helper-text">{booking.customerName} • {booking.tourTitle}</p>
                </div>
                <div className="admin-list-item-side">
                  <span className={getAdminBookingBadgeClass(booking.status, booking.deleteFlg)}>
                    {getAdminBookingStatusLabel(booking.status)}
                  </span>
                  <span className="chip">{formatCurrency(booking.totalPrice)}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="admin-report-card">
          <div className="admin-report-head">
            <div>
              <h3>Payment gần đây</h3>
              <p>Theo dõi nhanh các giao dịch mới ghi nhận và trạng thái hiện tại.</p>
            </div>
          </div>

          <div className="admin-list-stack">
            {recentPayments.map((payment) => (
              <article className="admin-list-item" key={payment.id}>
                <div>
                  <strong>{payment.id}</strong>
                  <p className="helper-text">
                    {payment.customerName} • {getAdminPaymentMethodLabel(payment.method)}
                  </p>
                </div>
                <div className="admin-list-item-side">
                  <span className={getAdminPaymentBadgeClass(payment.status)}>
                    {getAdminPaymentStatusLabel(payment.status)}
                  </span>
                  <span className="chip">{formatCurrency(payment.amount)}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="admin-report-card">
          <div className="admin-report-head">
            <div>
              <h3>Người dùng cập nhật gần đây</h3>
              <p>Rà soát nhanh các tài khoản vừa thay đổi để kiểm tra phân quyền và trạng thái sử dụng.</p>
            </div>
          </div>

          <div className="admin-list-stack">
            {recentUsers.map((user) => (
              <article className="admin-list-item" key={user.id}>
                <div>
                  <strong>{user.fullName}</strong>
                  <p className="helper-text">
                    {getAdminRoleLabel(user.role)} • {formatDateTime(user.updatedAt)}
                  </p>
                </div>
                <div className="admin-list-item-side">
                  <span className={getAdminUserBadgeClass(user.status, user.deleteFlg)}>
                    {user.deleteFlg ? 'Đã xóa mềm' : getAdminUserStatusLabel(user.status)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

export default AdminDashboardPage;
