import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionHeading from '../../components/SectionHeading.jsx';
import { ADMIN_PERMISSION_KEYS, getStoredAdminUser, hasAdminPermission } from '../../services/admin/adminAuthService.js';
import { getAdminMeta } from '../../services/admin/adminMetaService.js';
import { getAdminPayments, refundAdminPayment, updateAdminPayment } from '../../services/admin/adminPaymentService.js';
import { formatCurrency } from '../../utils/formatters.js';
import {
  formatDateTime,
  getAdminPaymentBadgeClass,
  getAdminPaymentMethodLabel,
  getAdminPaymentStatusLabel,
} from '../../utils/adminFormatters.js';

const EMPTY_ADMIN_META = {
  paymentMethodOptions: [],
  paymentStatusOptions: [],
};

/**
 * Lọc payment theo từ khóa, trạng thái và phương thức thanh toán.
 */
function filterPayments(paymentList, searchKeyword, statusFilter, methodFilter) {
  const normalizedKeyword = searchKeyword.trim().toLowerCase();

  return paymentList.filter((payment) => {
    const matchesKeyword =
      !normalizedKeyword ||
      payment.id.toLowerCase().includes(normalizedKeyword) ||
      payment.bookingCode.toLowerCase().includes(normalizedKeyword) ||
      payment.customerName.toLowerCase().includes(normalizedKeyword);
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;

    return matchesKeyword && matchesStatus && matchesMethod;
  });
}

/**
 * Tính số lượng theo từng nhóm payment để phục vụ KPI và bộ lọc đối soát.
 */
function buildPaymentSummary(filteredPayments) {
  const paidPayments = filteredPayments.filter((payment) => payment.status === 'paid');
  const waitingPayments = filteredPayments.filter((payment) => payment.status === 'waiting');
  const refundedPayments = filteredPayments.filter((payment) => payment.status === 'refunded');
  const failedPayments = filteredPayments.filter((payment) => payment.status === 'failed');

  return {
    failedPayments,
    paidPayments,
    paidRevenue: paidPayments.reduce((sum, payment) => sum + payment.amount, 0),
    refundedPayments,
    waitingPayments,
  };
}

/**
 * Danh sách payment cho admin theo hướng gọn và phục vụ đối soát nhanh.
 */
function AdminPaymentListPage() {
  const currentAdmin = getStoredAdminUser();
  const canRefundPayments = hasAdminPermission(ADMIN_PERMISSION_KEYS.PAYMENTS_REFUND, currentAdmin);
  const [paymentList, setPaymentList] = useState([]);
  const [adminMeta, setAdminMeta] = useState(EMPTY_ADMIN_META);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  /**
   * Tải payment để phần đối soát, KPI và bảng chi tiết dùng chung dữ liệu.
   */
  async function loadPayments() {
    setIsLoading(true);

    try {
      const [payments, meta] = await Promise.all([getAdminPayments(), getAdminMeta()]);
      setPaymentList(payments);
      setAdminMeta({
        paymentMethodOptions: meta.paymentMethodOptions ?? [],
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
   * Chốt nhanh payment hoặc hoàn tiền ngay trên danh sách.
   */
  async function handleQuickPaymentAction(payment) {
    try {
      const updatedPayment =
        payment.status === 'waiting'
          ? await updateAdminPayment(payment.id, { status: 'paid' })
          : payment.status === 'paid' && canRefundPayments
            ? await refundAdminPayment(payment.id)
            : null;

      if (!updatedPayment) {
        return;
      }

      setPaymentList((currentPayments) =>
        currentPayments.map((item) => (item.id === payment.id ? updatedPayment : item)),
      );
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  const filteredPayments = useMemo(
    () => filterPayments(paymentList, searchKeyword, statusFilter, methodFilter),
    [methodFilter, paymentList, searchKeyword, statusFilter],
  );

  const { failedPayments, paidPayments, paidRevenue, refundedPayments, waitingPayments } = useMemo(
    () => buildPaymentSummary(filteredPayments),
    [filteredPayments],
  );

  return (
    <div className="page-stack">
      <section className="admin-toolbar-card">
        <div className="admin-toolbar-head">
          <SectionHeading
            eyebrow="Thanh toán"
            title="Đối soát giao dịch, xác nhận doanh thu và xử lý hoàn tiền"
            description="Theo dõi trạng thái giao dịch, số tiền đã ghi nhận và các trường hợp cần kiểm tra hoặc hoàn tiền."
          />
          <button className="button button-secondary" type="button" onClick={loadPayments}>
            Tải lại dữ liệu
          </button>
        </div>

        <div className="admin-kpi-grid">
          <article className="admin-kpi-card">
            <span>Giao dịch đang hiển thị</span>
            <strong>{filteredPayments.length}</strong>
            <div className="admin-kpi-meta">{paymentList.length} payment trong nguồn dữ liệu</div>
          </article>
          <article className="admin-kpi-card">
            <span>Đã thanh toán</span>
            <strong>{paidPayments.length}</strong>
            <div className="admin-kpi-meta">{formatCurrency(paidRevenue)} đã ghi nhận</div>
          </article>
          <article className="admin-kpi-card">
            <span>Chờ đối soát</span>
            <strong>{waitingPayments.length}</strong>
            <div className="admin-kpi-meta">{failedPayments.length} giao dịch thất bại cần gọi lại</div>
          </article>
          <article className="admin-kpi-card">
            <span>Đã hoàn tiền</span>
            <strong>{refundedPayments.length}</strong>
            <div className="admin-kpi-meta">Theo dõi sát để cân bằng doanh thu ròng</div>
          </article>
        </div>
      </section>

      <section className="admin-toolbar-card">
        <div className="admin-toolbar-grid">
          <div>
            <h3>Bộ lọc đối soát</h3>
            <p>Lọc theo trạng thái hoặc phương thức để gom nhóm giao dịch cho từng đầu việc đối soát.</p>
          </div>
          <div className="admin-results-meta">
            <span className="chip">{waitingPayments.length} waiting</span>
            <span className="chip">{failedPayments.length} failed</span>
            <span className="chip">{formatCurrency(paidRevenue)} paid</span>
          </div>
        </div>

        <div className="admin-filter-grid admin-filter-grid-wide">
          <label className="form-field">
            <span>Tìm theo mã payment, mã booking hoặc tên khách</span>
            <input
              placeholder="Ví dụ: PAY-2026-001 hoặc BK-2026-001"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Trạng thái payment</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {adminMeta.paymentStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Phương thức thanh toán</span>
            <select value={methodFilter} onChange={(event) => setMethodFilter(event.target.value)}>
              {adminMeta.paymentMethodOptions.map((option) => (
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
            <h2>Danh sách thanh toán</h2>
            <p className="helper-text">Truy cập nhanh để xác nhận thu tiền, thực hiện hoàn tiền hoặc kiểm tra chi tiết giao dịch.</p>
          </div>
          <div className="admin-results-meta">
            <span className="chip">{filteredPayments.length} kết quả</span>
            <span className="chip">{formatCurrency(paidRevenue)} doanh thu đã thu</span>
          </div>
        </div>

        {isLoading ? (
          <p className="helper-text">Đang tải danh sách thanh toán...</p>
        ) : filteredPayments.length ? (
          <div className="admin-table-shell">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Payment</th>
                  <th>Khách hàng</th>
                  <th>Số tiền</th>
                  <th>Phương thức</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td data-label="Payment">
                      <div className="admin-table-user">
                        <strong>{payment.id}</strong>
                        <span>{payment.bookingCode}</span>
                        <p>{payment.tourTitle}</p>
                      </div>
                    </td>
                    <td data-label="Khách hàng">{payment.customerName}</td>
                    <td data-label="Số tiền">{formatCurrency(payment.amount)}</td>
                    <td data-label="Phương thức">{getAdminPaymentMethodLabel(payment.method)}</td>
                    <td data-label="Trạng thái">
                      <span className={getAdminPaymentBadgeClass(payment.status)}>
                        {getAdminPaymentStatusLabel(payment.status)}
                      </span>
                    </td>
                    <td data-label="Thời gian">
                      <div className="admin-table-meta">
                        <span>Tạo: {formatDateTime(payment.createdAt)}</span>
                        <span>Ghi nhận: {formatDateTime(payment.paidAt)}</span>
                      </div>
                    </td>
                    <td data-label="Thao tác">
                      <div className="admin-table-actions">
                        <Link className="button button-secondary" to={`/admin/payments/${payment.id}`}>
                          Chi tiết
                        </Link>
                        {/* Chỉ waiting và paid mới có thao tác nhanh, vì refunded/failed cần giữ nguyên lịch sử đối soát. */}
                        {payment.status === 'waiting' || (payment.status === 'paid' && canRefundPayments) ? (
                          <button
                            className={payment.status === 'paid' ? 'button button-warning' : 'button button-ghost'}
                            type="button"
                            onClick={() => handleQuickPaymentAction(payment)}
                          >
                            {payment.status === 'waiting' ? 'Xác nhận đã nhận tiền' : 'Hoàn tiền nhanh'}
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
            <h3>Không có payment nào phù hợp bộ lọc</h3>
            <p>Thử điều chỉnh trạng thái hoặc phương thức thanh toán để rà soát thêm các giao dịch liên quan.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminPaymentListPage;
