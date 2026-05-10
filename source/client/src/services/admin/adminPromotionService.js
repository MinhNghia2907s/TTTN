import { apiRequest } from '../user/apiClient'; // Import đúng tên hàm bạn đã export

export const adminPromotionService = {
  /**
   * Lấy danh sách toàn bộ mã khuyến mãi
   */
  getPromotions: async () => {
    // apiRequest trả về thẳng responseData.data nên không cần .data nữa
    const data = await apiRequest('/admin/promotions', { method: 'GET' });
    return { success: true, data }; // Đóng gói lại cho giống format cũ bạn dùng ở Page
  },

  /**
   * Lấy chi tiết một mã
   */
  getPromotion: async (id) => {
    const data = await apiRequest(`/admin/promotions/${id}`, { method: 'GET' });
    return { success: true, data };
  },

  /**
   * Tạo mới
   */
  createPromotion: async (formData) => {
    const data = await apiRequest('/admin/promotions', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    return { success: true, data };
  },

  /**
   * Cập nhật
   */
  updatePromotion: async (id, formData) => {
    const data = await apiRequest(`/admin/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(formData),
    });
    return { success: true, data };
  },

  /**
   * Xóa
   */
  deletePromotion: async (id) => {
    const data = await apiRequest(`/admin/promotions/${id}`, { method: 'DELETE' });
    return { success: true, data };
  }
};