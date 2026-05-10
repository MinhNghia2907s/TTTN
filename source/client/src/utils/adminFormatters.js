/**
 * Bộ formatter/label chung cho toàn khu vực admin:
 * - map mã nội bộ sang nhãn tiếng Việt
 * - chọn badge class theo trạng thái
 * - định dạng ngày giờ để bảng/detail đọc nhanh hơn
 */
const roleLabels = {
  admin: 'Quản trị viên',
  staff: 'Nhân viên',
  user: 'Người dùng',
};

const userStatusLabels = {
  active: 'Đang hoạt động',
  inactive: 'Tạm ngưng',
  blocked: 'Bị khóa',
};

const tourStatusLabels = {
  published: 'Đang mở bán',
  draft: 'Bản nháp',
  archived: 'Tạm ẩn',
};

const bookingStatusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  completed: 'Đã hoàn tất',
  cancelled: 'Đã hủy',
};

const paymentStatusLabels = {
  waiting: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  refunded: 'Đã hoàn tiền',
  failed: 'Thất bại',
};

const paymentMethodLabels = {
  payos: 'PayOS',
  card: 'Thẻ nội địa / quốc tế',
  bank_transfer: 'Chuyển khoản',
  ewallet: 'Ví điện tử',
  cash: 'Tiền mặt',
};

const departureStatusLabels = {
  open: 'Đang nhận khách',
  nearly_full: 'Sắp đầy',
  closed: 'Đã khóa',
};

/**
 * Định dạng ngày giờ cho các màn hình quản trị cần xem thông tin gần nhất.
 */
export function formatDateTime(value) {
  if (!value) {
    return 'Chưa cập nhật';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

/**
 * Trả về nhãn vai trò để bảng và form quản trị hiển thị dễ đọc hơn.
 */
export function getAdminRoleLabel(role) {
  return roleLabels[role] ?? role;
}

/**
 * Trả về nhãn trạng thái tài khoản cho giao diện quản lý người dùng.
 */
export function getAdminUserStatusLabel(status) {
  return userStatusLabels[status] ?? status;
}

/**
 * Trả về nhãn trạng thái tour cho danh sách và form quản lý tour.
 */
export function getAdminTourStatusLabel(status) {
  return tourStatusLabels[status] ?? status;
}

/**
 * Trả về nhãn trạng thái booking để admin nhìn bảng nhanh hơn.
 */
export function getAdminBookingStatusLabel(status) {
  return bookingStatusLabels[status] ?? status;
}

/**
 * Trả về nhãn trạng thái thanh toán cho danh sách payment.
 */
export function getAdminPaymentStatusLabel(status) {
  return paymentStatusLabels[status] ?? status;
}

/**
 * Trả về nhãn phương thức thanh toán để form chi tiết dễ hiểu hơn.
 */
export function getAdminPaymentMethodLabel(method) {
  return paymentMethodLabels[method] ?? method;
}

/**
 * Trả về nhãn trạng thái lịch khởi hành trong form tour.
 */
export function getAdminDepartureStatusLabel(status) {
  return departureStatusLabels[status] ?? status;
}

/**
 * Chọn tone badge cho trạng thái tài khoản người dùng.
 */
export function getAdminUserBadgeClass(status, deleteFlg) {
  if (deleteFlg) {
    return 'admin-badge admin-badge-muted';
  }

  if (status === 'blocked') {
    return 'admin-badge admin-badge-danger';
  }

  if (status === 'inactive') {
    return 'admin-badge admin-badge-warning';
  }

  return 'admin-badge admin-badge-success';
}

/**
 * Chọn tone badge cho trạng thái tour để bảng và dashboard đồng bộ màu.
 */
export function getAdminTourBadgeClass(status, deleteFlg = false) {
  if (deleteFlg) {
    return 'admin-badge admin-badge-muted';
  }

  if (status === 'draft') {
    return 'admin-badge admin-badge-warning';
  }

  if (status === 'archived') {
    return 'admin-badge admin-badge-muted';
  }

  return 'admin-badge admin-badge-success';
}

/**
 * Chọn tone badge cho trạng thái booking để admin dễ nhận biết booking cần xử lý.
 */
export function getAdminBookingBadgeClass(status, deleteFlg = false) {
  if (deleteFlg) {
    return 'admin-badge admin-badge-muted';
  }

  if (status === 'pending') {
    return 'admin-badge admin-badge-warning';
  }

  if (status === 'cancelled') {
    return 'admin-badge admin-badge-danger';
  }

  if (status === 'completed') {
    return 'admin-badge admin-badge-info';
  }

  return 'admin-badge admin-badge-success';
}

/**
 * Chọn tone badge cho trạng thái thanh toán để bảng payment có màu nhất quán.
 */
export function getAdminPaymentBadgeClass(status) {
  if (status === 'waiting') {
    return 'admin-badge admin-badge-warning';
  }

  if (status === 'failed') {
    return 'admin-badge admin-badge-danger';
  }

  if (status === 'refunded') {
    return 'admin-badge admin-badge-info';
  }

  return 'admin-badge admin-badge-success';
}
