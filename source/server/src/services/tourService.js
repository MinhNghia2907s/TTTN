import {
  findAllTours,
  findFeaturedTours,
  findTestimonials,
  findTourById,
} from '../models/tourModel.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Service tour chỉ đóng vai trò điều phối, để bộ lọc SQL nằm ở model.
 */
export async function getTours(filters) {
  return findAllTours(filters);
}

/**
 * Lấy tour nổi bật cho trang chủ.
 */
export async function getFeaturedTours(limit) {
  return findFeaturedTours(limit ? Number(limit) : 3);
}

/**
 * Lấy testimonials cho landing page.
 */
export async function getLandingTestimonials() {
  return findTestimonials();
}

/**
 * Báo lỗi 404 nếu id tour không tồn tại trong DB.
 */
export async function getTourDetail(tourId) {
  const tour = await findTourById(tourId);

  if (!tour) {
    throw new ApiError(404, 'Không tìm thấy tour.');
  }

  return tour;
}
