import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { adminPromotionService } from '../../services/admin/adminPromotionService';
import FormField from '../../components/FormField.jsx';

function AdminPromotionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    discountType: 'percent',
    discountValue: 0,
    minTravelers: 1,
    status: 'active',
    startsAt: '',
    endsAt: ''
  });

  useEffect(() => {
    if (isEditMode) {
      setLoading(true);
      adminPromotionService.getPromotion(id)
        .then(res => {
          if (res.success && res.data) {
            const d = res.data;
            setFormData({
              ...d,
              startsAt: d.startsAt ? new Date(d.startsAt).toISOString().slice(0, 16) : '',
              endsAt: d.endsAt ? new Date(d.endsAt).toISOString().slice(0, 16) : ''
            });
          }
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase() : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = isEditMode 
        ? await adminPromotionService.updatePromotion(id, formData)
        : await adminPromotionService.createPromotion(formData);
      
      if (res.success) {
        navigate('/admin/promotions');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Có lỗi xảy ra khi lưu dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <p className="helper-text p-8">Đang tải thông tin mã giảm giá...</p>;

  return (
    <div className="page-stack">
      {/* SECTION HEADING - GIỐNG HỆT TRANG TOUR */}
      <section className="content-card">
        <div className="section-heading-row admin-page-actions">
          <div>
            <p className="booking-id">{isEditMode ? `PROMO #${id}` : 'PROMO-NEW'}</p>
            <h2>{isEditMode ? 'Chỉnh sửa mã giảm giá' : 'Thêm chương trình ưu đãi mới'}</h2>
            <p className="helper-text">
              {isEditMode 
                ? `Mã giảm giá hiện tại đang ở trạng thái ${formData.status === 'active' ? 'đang hoạt động' : 'tạm dừng'}.`
                : 'Thiết lập các điều kiện áp dụng, mức giảm và thời gian hiệu lực cho mã.'}
            </p>
          </div>

          <div className="admin-topbar-actions">
            <Link className="button button-secondary" to="/admin/promotions">
              Về danh sách
            </Link>
          </div>
        </div>
      </section>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <div className="admin-detail-grid">
        {/* CỘT TRÁI - FORM NHẬP LIỆU */}
        <section className="content-card">
          <form className="form-card" onSubmit={handleSubmit}>
            <h2>Thông tin cấu hình</h2>

            <div className="admin-form-grid">
              <FormField 
                label="Mã Code" 
                name="code" 
                onChange={handleInputChange} 
                value={formData.code} 
                placeholder="VD: SUMMER2024"
              />
              <FormField 
                label="Tên chương trình" 
                name="name" 
                onChange={handleInputChange} 
                value={formData.name} 
                placeholder="VD: Ưu đãi chào hè"
              />
              
              <FormField
                as="select"
                label="Loại giảm giá"
                name="discountType"
                onChange={handleInputChange}
                value={formData.discountType}
                options={[
                  { value: 'percent', label: 'Theo phần trăm (%)' },
                  { value: 'fixed', label: 'Số tiền cố định (đ)' }
                ]}
              />

              <FormField 
                label="Giá trị giảm" 
                name="discountValue" 
                type="number" 
                onChange={handleInputChange} 
                value={formData.discountValue} 
              />

              <FormField
                as="select"
                label="Trạng thái"
                name="status"
                onChange={handleInputChange}
                value={formData.status}
                options={[
                  { value: 'active', label: 'Đang hoạt động' },
                  { value: 'inactive', label: 'Tạm dừng' }
                ]}
              />

              <FormField 
                label="Số khách tối thiểu" 
                name="minTravelers" 
                type="number" 
                onChange={handleInputChange} 
                value={formData.minTravelers} 
              />
            </div>

            <div className="admin-form-grid mt-4">
               <FormField 
                label="Ngày bắt đầu" 
                name="startsAt" 
                type="datetime-local" 
                onChange={handleInputChange} 
                value={formData.startsAt} 
              />
               <FormField 
                label="Ngày kết thúc" 
                name="endsAt" 
                type="datetime-local" 
                onChange={handleInputChange} 
                value={formData.endsAt} 
              />
            </div>

            <div className="admin-form-actions">
              <button 
                className="button button-primary" 
                disabled={isSubmitting} 
                type="submit"
              >
                {isSubmitting ? 'Đang lưu...' : isEditMode ? 'Lưu cập nhật' : 'Tạo mã mới'}
              </button>
              <Link className="button button-secondary" to="/admin/promotions">
                Hủy và quay lại
              </Link>
            </div>
          </form>
        </section>

        {/* CỘT PHẢI - TÓM TẮT (SUMMARY) - GIỐNG HỆT TRANG TOUR */}
        <section className="content-card">
          <h2>Tóm tắt nhanh</h2>
          <div className="admin-summary-grid">
            <article className="admin-mini-card">
              <span>Mức giảm</span>
              <strong>
                {formData.discountType === 'percent' 
                  ? `${formData.discountValue}%` 
                  : `${Number(formData.discountValue).toLocaleString()}đ`}
              </strong>
            </article>
            <article className="admin-mini-card">
              <span>Áp dụng cho</span>
              <strong>Từ {formData.minTravelers} khách</strong>
            </article>
          </div>

          <div className="admin-list-stack">
            <article className="admin-mini-card">
              <span>Trạng thái hiện tại</span>
              <strong className={formData.status === 'active' ? 'text-success' : 'text-danger'}>
                {formData.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}
              </strong>
            </article>
            <article className="admin-mini-card">
              <span>Thời hạn áp dụng</span>
              <strong>
                {formData.startsAt ? new Date(formData.startsAt).toLocaleDateString('vi-VN') : '---'}
              </strong>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminPromotionFormPage;