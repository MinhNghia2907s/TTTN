import {
  getPaymentDetail,
  handlePayosWebhook,
  payForBooking,
  syncPayosPaymentStatus,
} from '../services/paymentService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function getPayment(req, res, next) {
  try {
    const result = await getPaymentDetail(req.user.id, req.params.bookingId);
    return sendSuccess(res, result, 'Lấy thông tin thanh toán thành công.');
  } catch (error) {
    return next(error);
  }
}

export async function createPayment(req, res, next) {
  try {
    const result = await payForBooking(req.user.id, req.body);
    return sendSuccess(res, result, 'Tạo link thanh toán PayOS thành công.', 201);
  } catch (error) {
    return next(error);
  }
}

export async function syncPayment(req, res, next) {
  try {
    const result = await syncPayosPaymentStatus(req.user.id, req.params.bookingId);
    return sendSuccess(res, result, 'Đồng bộ trạng thái thanh toán PayOS thành công.');
  } catch (error) {
    return next(error);
  }
}

export async function receivePayosWebhook(req, res, next) {
  try {
    const result = await handlePayosWebhook(req.body);
    return sendSuccess(res, result, 'Cập nhật webhook PayOS thành công.');
  } catch (error) {
    return next(error);
  }
}
