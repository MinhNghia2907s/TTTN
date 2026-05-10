import {
  getFeaturedTours,
  getLandingTestimonials,
  getTourDetail,
  getTours,
} from '../services/tourService.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * Trả danh sách tour theo bộ lọc query string.
 */
export async function listTours(req, res, next) {
  try {
    const tours = await getTours(req.query);
    return sendSuccess(res, tours, 'Lấy danh sách tour thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Trả nhóm tour nổi bật cho homepage.
 */
export async function listFeaturedTours(req, res, next) {
  try {
    const tours = await getFeaturedTours(req.query.limit);
    return sendSuccess(res, tours, 'Lấy tour nổi bật thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Trả chi tiết một tour theo id.
 */
export async function getTour(req, res, next) {
  try {
    const tour = await getTourDetail(req.params.tourId);
    return sendSuccess(res, tour, 'Lấy chi tiết tour thành công.');
  } catch (error) {
    return next(error);
  }
}

/**
 * Trả testimonials hiển thị trên landing page.
 */
export async function listTestimonials(req, res, next) {
  try {
    const testimonials = await getLandingTestimonials();
    return sendSuccess(res, testimonials, 'Lấy testimonial thành công.');
  } catch (error) {
    return next(error);
  }
}
