import { getBookingDisplayStatus } from '../utils/formatters.js';

/**
 * Hiển thị trạng thái booking và trạng thái thanh toán dưới dạng pill.
 */
function BookingStatusPill({ status, paymentStatus }) {
  const displayStatus = getBookingDisplayStatus(status, paymentStatus);

  return (
    <div className="status-group">
      <span className={displayStatus.className}>{displayStatus.label}</span>
    </div>
  );
}

export default BookingStatusPill;
