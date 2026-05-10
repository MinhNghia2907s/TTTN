import { apiRequest } from './apiClient.js';

/**
 * Lấy tour nổi bật cho trang chủ.
 */
export function getFeaturedTours() {
  return apiRequest('/tours/featured');
}

/**
 * Lấy testimonial cho landing page.
 */
export function getTestimonials() {
  return apiRequest('/tours/testimonials');
}

/**
 * Lấy danh sách tour có hỗ trợ lọc bằng query string.
 */
export function getAllTours(filters = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return apiRequest(`/tours${query ? `?${query}` : ''}`);
}

/**
 * Lấy chi tiết một tour theo id.
 */
export function getTourDetail(tourId) {
  return apiRequest(`/tours/${tourId}`);
}
