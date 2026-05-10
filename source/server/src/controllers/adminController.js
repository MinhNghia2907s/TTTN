import {
  createTourByAdmin as createTourByAdminService,
  createTourImportTemplateBuffer,
  deleteAdminUser as deleteAdminUserService,
  deleteBookingByAdmin as deleteBookingByAdminService,
  deleteTourByAdmin as deleteTourByAdminService,
  editAdminUser as editAdminUserService,
  getAdminMeta as getAdminMetaService,
  getAdminBookingDetail as getAdminBookingDetailService,
  getAdminBookingList as getAdminBookingListService,
  getAdminPaymentDetail as getAdminPaymentDetailService,
  getAdminPaymentList as getAdminPaymentListService,
  getAdminTourDetail as getAdminTourDetailService,
  getAdminTourList as getAdminTourListService,
  getAdminUserDetail as getAdminUserDetailService,
  getAdminUserList as getAdminUserListService,
  importToursByAdmin as importToursByAdminService,
  refundPaymentByAdmin as refundPaymentByAdminService,
  updateBookingStatusByAdmin as updateBookingStatusByAdminService,
  updatePaymentStatusByAdmin as updatePaymentStatusByAdminService,
  updateTourByAdmin as updateTourByAdminService,
} from '../services/adminService.js';
import { ApiError } from '../utils/apiError.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * Controller admin được giữ rất mỏng:
 * - nhận params/body từ route
 * - gọi service tương ứng
 * - trả response chuẩn qua `sendSuccess`
 *
 * Toàn bộ rule nghiệp vụ nằm ở `adminService.js` để dễ bảo trì.
 */
export async function getAdminMeta(req, res, next) {
  try {
    const meta = await getAdminMetaService();
    return sendSuccess(res, meta, 'Lấy metadata admin thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Trả danh sách người dùng cho khu vực admin.
 */
export async function listAdminUsers(req, res, next) {
  try {
    const users = await getAdminUserListService();
    return sendSuccess(res, users, 'Lấy danh sách người dùng thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Trả chi tiết một người dùng cho màn hình admin detail.
 */
export async function getAdminUser(req, res, next) {
  try {
    const { userId } = req.params;
    const user = await getAdminUserDetailService(userId);
    return sendSuccess(res, user, 'Lấy chi tiết người dùng thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Cập nhật user từ khu vực admin.
 */
export async function updateAdminUser(req, res, next) {
  try {
    const { userId } = req.params;
    const user = await editAdminUserService(req.user.id, userId, req.body);
    return sendSuccess(res, user, 'Cập nhật người dùng thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Xóa mềm user từ khu vực admin.
 */
export async function removeAdminUser(req, res, next) {
  try {
    const { userId } = req.params;
    const user = await deleteAdminUserService(req.user.id, userId);
    return sendSuccess(res, user, 'Xóa mềm người dùng thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Trả danh sách tour cho khu vực admin.
 */
export async function listAdminTours(req, res, next) {
  try {
    const tours = await getAdminTourListService();
    return sendSuccess(res, tours, 'Lấy danh sách tour thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Trả chi tiết một tour cho form chỉnh sửa admin.
 */
export async function getAdminTour(req, res, next) {
  try {
    const { tourId } = req.params;
    const tour = await getAdminTourDetailService(tourId);
    return sendSuccess(res, tour, 'Lấy chi tiết tour thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Tạo tour mới từ khu vực admin.
 */
export async function createAdminTour(req, res, next) {
  try {
    const tour = await createTourByAdminService(req.body);
    return sendSuccess(res, tour, 'Tạo tour thành công.', 201);
  } catch (error) {
    return next(error);
  }
}

/**
 * Trả file Excel mẫu để admin tải về trước khi import nhiều tour.
 */
export function downloadAdminTourImportTemplate(req, res, next) {
  try {
    const fileBuffer = createTourImportTemplateBuffer();

    res.setHeader('Content-Disposition', 'attachment; filename="mau_import_tour.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.status(200).send(fileBuffer);
  } catch (error) {
    return next(error);
  }
}

/**
 * Nhận file Excel từ popup import và tạo nhiều tour trong một lần.
 */
export async function importAdminTours(req, res, next) {
  try {
    if (!req.file?.buffer) {
      return next(new ApiError(400, 'Vui lòng chọn file Excel để import.'));
    }

    const result = await importToursByAdminService(req.file.buffer);
    return sendSuccess(res, result, `Import thành công ${result.importedCount} tour.`, 201);
  } catch (error) {
    return next(error);
  }
}

/**
 * Cập nhật tour hiện có từ khu vực admin.
 */
export async function updateAdminTour(req, res, next) {
  try {
    const { tourId } = req.params;
    const tour = await updateTourByAdminService(tourId, req.body);
    return sendSuccess(res, tour, 'Cập nhật tour thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Xóa mềm tour từ khu vực admin.
 */
export async function removeAdminTour(req, res, next) {
  try {
    const { tourId } = req.params;
    const tour = await deleteTourByAdminService(tourId);
    return sendSuccess(res, tour, 'Xóa mềm tour thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Trả danh sách booking cho khu vực admin.
 */
export async function listAdminBookings(req, res, next) {
  try {
    const bookings = await getAdminBookingListService();
    return sendSuccess(res, bookings, 'Lấy danh sách booking thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Trả chi tiết một booking theo booking_code.
 */
export async function getAdminBooking(req, res, next) {
  try {
    const { bookingCode } = req.params;
    const booking = await getAdminBookingDetailService(bookingCode);
    return sendSuccess(res, booking, 'Lấy chi tiết booking thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Cập nhật trạng thái booking từ khu vực admin.
 */
export async function updateAdminBookingStatus(req, res, next) {
  try {
    const { bookingCode } = req.params;
    const booking = await updateBookingStatusByAdminService(bookingCode, req.body);
    return sendSuccess(res, booking, 'Cập nhật trạng thái booking thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Xóa mềm booking từ khu vực admin.
 */
export async function removeAdminBooking(req, res, next) {
  try {
    const { bookingCode } = req.params;
    const booking = await deleteBookingByAdminService(bookingCode);
    return sendSuccess(res, booking, 'Xóa mềm booking thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Trả danh sách payment cho khu vực admin.
 */
export async function listAdminPayments(req, res, next) {
  try {
    const payments = await getAdminPaymentListService();
    return sendSuccess(res, payments, 'Lấy danh sách thanh toán thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Trả chi tiết một payment theo payment_code.
 */
export async function getAdminPayment(req, res, next) {
  try {
    const { paymentCode } = req.params;
    const payment = await getAdminPaymentDetailService(paymentCode);
    return sendSuccess(res, payment, 'Lấy chi tiết thanh toán thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Cập nhật trạng thái payment từ khu vực admin.
 */
export async function updateAdminPaymentStatus(req, res, next) {
  try {
    const { paymentCode } = req.params;
    const payment = await updatePaymentStatusByAdminService(paymentCode, req.body);
    return sendSuccess(res, payment, 'Cập nhật trạng thái thanh toán thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Hoàn tiền payment từ khu vực admin.
 */
export async function refundAdminPayment(req, res, next) {
  try {
    const { paymentCode } = req.params;
    const payment = await refundPaymentByAdminService(paymentCode);
    return sendSuccess(res, payment, 'Hoàn tiền thanh toán thành công.');
  } catch (error) {
    return next(error);
  }
}
