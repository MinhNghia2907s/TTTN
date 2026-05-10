import { findActivePromotionByCode } from '../models/promotionModel.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Chuẩn hóa mã khuyến mãi về chữ in hoa để user nhập tourgroup10 hay TOURGROUP10 đều đúng.
 */
export function normalizePromotionCode(code) {
  return String(code || '').trim().toUpperCase();
}

/**
 * Tính số tiền được giảm theo loại mã:
 * - percent: giảm theo phần trăm tổng tiền trước giảm
 * - fixed: giảm một số tiền cố định
 * Luôn chặn discount không vượt quá subtotal để tổng thanh toán không bị âm.
 */
function calculateDiscountAmount(subtotalPrice, promotion) {
  if (!promotion) {
    return 0;
  }

  if (promotion.discountType === 'percent') {
    return Math.min(Math.round((subtotalPrice * promotion.discountValue) / 100), subtotalPrice);
  }

  return Math.min(promotion.discountValue, subtotalPrice);
}

/**
 * Hàm trung tâm để tính giá booking.
 * Backend dùng hàm này cho cả "xem trước giá" và "tạo booking" để tránh frontend tự tính sai.
 */
export async function calculateBookingPrice({ connection = null, promotionCode, travelerCount, unitPrice }) {
  const normalizedTravelerCount = Number(travelerCount);
  const normalizedUnitPrice = Number(unitPrice);

  if (!Number.isInteger(normalizedTravelerCount) || normalizedTravelerCount < 1) {
    throw new ApiError(400, 'Số lượng hành khách không hợp lệ.');
  }

  if (!Number.isFinite(normalizedUnitPrice) || normalizedUnitPrice < 0) {
    throw new ApiError(400, 'Giá tour không hợp lệ.');
  }

  const subtotalPrice = normalizedUnitPrice * normalizedTravelerCount;
  const normalizedCode = normalizePromotionCode(promotionCode);

  if (!normalizedCode) {
    return {
      discountAmount: 0,
      message: 'Chưa áp dụng mã khuyến mãi.',
      promotionCode: null,
      subtotalPrice,
      totalPrice: subtotalPrice,
    };
  }

  const promotion = await findActivePromotionByCode(normalizedCode, connection);

  if (!promotion) {
    throw new ApiError(400, 'Mã khuyến mãi không tồn tại hoặc đã hết hiệu lực.');
  }

  if (normalizedTravelerCount < promotion.minTravelers) {
    throw new ApiError(
      400,
      `Mã ${promotion.code} chỉ áp dụng cho booking từ ${promotion.minTravelers} khách trở lên.`,
    );
  }

  const discountAmount = calculateDiscountAmount(subtotalPrice, promotion);
  const totalPrice = Math.max(subtotalPrice - discountAmount, 0);

  return {
    discountAmount,
    message: `Đã áp dụng mã ${promotion.code}: ${promotion.name}.`,
    promotionCode: promotion.code,
    subtotalPrice,
    totalPrice,
  };
}
