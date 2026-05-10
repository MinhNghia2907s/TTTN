import {
  cancelUserBooking,
  createUserBooking,
  getUserBookingDetail,
  getUserBookings,
  quoteUserBooking,
} from '../services/bookingService.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * `GET /bookings`
 */
export async function listBookings(req, res, next) {
  try {
    const bookings = await getUserBookings(req.user.id);
    return sendSuccess(res, bookings, 'Lấy lịch sử booking thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * `GET /bookings/:bookingId`
 */
export async function getBooking(req, res, next) {
  try {
    const booking = await getUserBookingDetail(req.user.id, req.params.bookingId);
    return sendSuccess(res, booking, 'Lấy chi tiết booking thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * `POST /bookings`
 */
export async function createBooking(req, res, next) {
  try {
    const booking = await createUserBooking(req.user, req.body);
    return sendSuccess(res, booking, 'Tạo booking thành công.', 201);
  } catch (error) {
    return next(error);
  }
}

/**
 * `POST /bookings/quote`
 */
export async function quoteBooking(req, res, next) {
  try {
    const quote = await quoteUserBooking(req.body);
    return sendSuccess(res, quote, 'Tính giá booking thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * `PATCH /bookings/:bookingId/cancel`
 */
export async function cancelBooking(req, res, next) {
  try {
    const booking = await cancelUserBooking(req.user.id, req.params.bookingId);
    return sendSuccess(res, booking, 'Hủy booking thành công.');
  } catch (error) {
    return next(error);
  }
}
