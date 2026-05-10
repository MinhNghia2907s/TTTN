import {
  createBooking,
  findBookingByIdAndUserId,
  findBookingsByUserId,
  updateBooking,
} from '../models/bookingModel.js';
import {
  findDepartureById,
  findTourById,
  releaseDepartureSlots,
  reserveDepartureSlots,
} from '../models/tourModel.js';
import { withTransaction } from '../config/database.js';
import { ApiError } from '../utils/apiError.js';
import { calculateBookingPrice } from './promotionService.js';

/**
 * Tạo 2 mốc timeline đầu tiên ngay khi booking vừa được tạo.
 */
function createInitialTimeline(travelers) {
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

  return [
    {
      detail: `Hệ thống đã tạm giữ chỗ cho ${travelers} hành khách.`,
      time: now,
      title: 'Yêu cầu đặt tour đã được tạo',
    },
    {
      detail: 'Cần hoàn tất thanh toán để khóa chỗ chính thức.',
      time: now,
      title: 'Chờ thanh toán',
    },
  ];
}

/**
 * Trả về lịch sử booking của user hiện tại.
 */
export async function getUserBookings(userId) {
  return findBookingsByUserId(userId);
}

/**
 * Đọc một booking chi tiết và chặn truy cập chéo giữa các user.
 */
export async function getUserBookingDetail(userId, bookingId) {
  const booking = await findBookingByIdAndUserId(bookingId, userId);

  if (!booking) {
    throw new ApiError(404, 'Không tìm thấy booking.');
  }

  return booking;
}

/**
 * Tính thử giá booking trước khi tạo booking thật.
 * Frontend gọi API quote để hiển thị đúng tiền giảm, nhưng backend vẫn là nơi tính giá cuối cùng.
 */
export async function quoteUserBooking(payload) {
  const { departureId, promotionCode, tourId, travelers } = payload;
  const normalizedTourId = Number(tourId);
  const normalizedDepartureId = String(departureId || '').trim();
  const travelerCount = Number(travelers);

  if (!normalizedTourId || !normalizedDepartureId || !travelerCount || travelerCount < 1) {
    throw new ApiError(400, 'Vui lòng chọn tour, lịch khởi hành và số lượng hành khách hợp lệ.');
  }

  const tour = await findTourById(normalizedTourId);
  const departure = await findDepartureById(normalizedTourId, normalizedDepartureId);

  if (!tour || !departure) {
    throw new ApiError(404, 'Tour hoặc lịch khởi hành không tồn tại.');
  }

  return calculateBookingPrice({
    promotionCode,
    travelerCount,
    unitPrice: departure.price,
  });
}

/**
 * Luồng tạo booking:
 * 1. validate input
 * 2. mở transaction
 * 3. đọc tour + departure
 * 4. giữ chỗ
 * 5. tạo booking
 */
export async function createUserBooking(user, payload) {
  const { departureId, email, fullName, note, paymentMethod, phone, promotionCode, tourId, travelers } = payload;
  const normalizedTourId = Number(tourId);
  const normalizedDepartureId = String(departureId || '').trim();
  const travelerCount = Number(travelers);

  if (!normalizedTourId || !normalizedDepartureId || !travelerCount || travelerCount < 1) {
    throw new ApiError(400, 'Vui lòng chọn tour, lịch khởi hành và số lượng hành khách hợp lệ.');
  }

  return withTransaction(async (connection) => {
    const tour = await findTourById(normalizedTourId, connection);
    const departure = await findDepartureById(normalizedTourId, normalizedDepartureId, connection);

    if (!tour || !departure) {
      throw new ApiError(404, 'Tour hoặc lịch khởi hành không tồn tại.');
    }

    if (departure.status !== 'open') {
      throw new ApiError(400, 'Lịch khởi hành này không còn mở để đặt chỗ.');
    }

    if (departure.slots < travelerCount) {
      throw new ApiError(400, 'Số chỗ còn lại không đủ cho lựa chọn của bạn.');
    }

    const reserved = await reserveDepartureSlots(
      normalizedTourId,
      normalizedDepartureId,
      travelerCount,
      connection,
    );

    if (!reserved) {
      throw new ApiError(400, 'Số chỗ còn lại vừa thay đổi. Vui lòng thử lại.');
    }

    // Giá tiền được tính trong transaction để booking lưu đúng giá tại thời điểm giữ chỗ.
    const priceQuote = await calculateBookingPrice({
      connection,
      promotionCode,
      travelerCount,
      unitPrice: departure.price,
    });

    return createBooking(
      {
        customerEmail: (email || user.email).trim().toLowerCase(),
        customerName: (fullName || user.fullName).trim(),
        customerPhone: (phone || user.phone).trim(),
        departureDbId: departure._departureDbId,
        discountAmount: priceQuote.discountAmount,
        notes: (note || '').trim() || 'Không có ghi chú thêm.',
        paymentMethod: paymentMethod || 'Chưa thanh toán',
        paymentStatus: 'waiting',
        promotionCode: priceQuote.promotionCode,
        status: 'pending',
        subtotalPrice: priceQuote.subtotalPrice,
        timeline: createInitialTimeline(travelerCount),
        totalPrice: priceQuote.totalPrice,
        tourId: normalizedTourId,
        travelers: travelerCount,
        userId: user.id,
      },
      connection,
    );
  });
}

/**
 * Hủy booking trong transaction để việc trả slot và đổi trạng thái luôn đi cùng nhau.
 */
export async function cancelUserBooking(userId, bookingId) {
  return withTransaction(async (connection) => {
    const booking = await findBookingByIdAndUserId(
      bookingId,
      userId,
      { includeInternal: true },
      connection,
    );

    if (!booking) {
      throw new ApiError(404, 'Không tìm thấy booking.');
    }

    if (booking.status === 'cancelled' || booking.status === 'completed') {
      throw new ApiError(400, 'Booking này không thể hủy.');
    }

    await releaseDepartureSlots(booking.tourId, booking.departureId, booking.travelers, connection);

    return updateBooking(
      booking._bookingDbId,
      {
        paymentStatus: booking.paymentStatus === 'paid' ? 'refunded' : booking.paymentStatus,
        status: 'cancelled',
        timeline: [
          ...booking.timeline,
          {
            detail: 'Booking đã được hủy từ phía người dùng.',
            time: new Date().toISOString().slice(0, 16).replace('T', ' '),
            title: 'Đã hủy booking',
          },
        ],
      },
      connection,
    );
  });
}
