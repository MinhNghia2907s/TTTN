import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminPromotionService } from '../../services/admin/adminPromotionService';

function AdminPromotionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id); // Đã đổi tên thống nhất thành isEditMode
  const [loading, setLoading] = useState(false);

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
      const fetchDetail = async () => {
        try {
          const res = await adminPromotionService.getPromotion(id);
          if (res.success && res.data) {
            const d = res.data;
            setFormData({
              ...d,
              startsAt: d.startsAt ? new Date(d.startsAt).toISOString().slice(0, 16) : '',
              endsAt: d.endsAt ? new Date(d.endsAt).toISOString().slice(0, 16) : ''
            });
          }
        } catch (error) {
          console.error("Lỗi khi lấy chi tiết:", error);
        }
      };
      fetchDetail();
    }
  }, [id, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = isEditMode 
        ? await adminPromotionService.updatePromotion(id, formData)
        : await adminPromotionService.createPromotion(formData);

      if (res.success) {
        alert(isEditMode ? "Cập nhật thành công!" : "Tạo mã thành công!");
        navigate('/admin/promotions');
      }
    } catch (error) {
      alert("Đã có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-content p-8 bg-[#f0f2f5] min-h-screen">
      {/* 1. HEADER */}
      <div className="mb-8">
        <span className="text-[12px] uppercase font-bold text-gray-400 tracking-widest">KHUYẾN MÃI</span>
        <div className="flex justify-between items-center mt-1">
          <h1 className="text-3xl font-light text-slate-800">
            {isEditMode ? 'Điều chỉnh thông số chương trình ưu đãi' : 'Thiết lập chương trình khuyến mãi mới'}
          </h1>
          <button 
            type="button"
            onClick={() => navigate('/admin/promotions')}
            className="px-6 py-2 bg-white border border-gray-200 rounded-xl font-bold text-slate-600 hover:bg-gray-50 shadow-sm transition-all"
          >
            Quay lại danh sách
          </button>
        </div>
        <p className="text-slate-500 mt-2 text-sm">Theo dõi mã giảm giá, thời gian áp dụng và mức độ tương tác của từng chương trình.</p>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Trạng thái hiện tại', value: isEditMode ? 'Đang chỉnh sửa' : 'Đang tạo mới', sub: 'Mã: ' + (formData.code || 'Chưa đặt') },
          { label: 'Loại áp dụng', value: formData.discountType === 'percent' ? 'Phần trăm' : 'Cố định', sub: 'Tự động tính toán' },
          { label: 'Khách tối thiểu', value: formData.minTravelers + ' khách', sub: 'Điều kiện áp dụng' },
          { label: 'Giá trị giảm', value: Number(formData.discountValue).toLocaleString() + (formData.discountType === 'percent' ? '%' : 'đ'), sub: 'Mức ưu đãi' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">{item.label}</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{item.value}</h3>
            <div className="mt-2 text-[11px] bg-gray-50 text-gray-500 py-1 px-3 rounded-full inline-block">{item.sub}</div>
          </div>
        ))}
      </div>

      {/* 3. MAIN FORM CARD */}
      <div className="bg-white rounded-[28px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30">
          <h2 className="font-bold text-slate-700">Thông tin chi tiết khuyến mãi</h2>
          <p className="text-xs text-gray-400">Mở chi tiết để cập nhật thông số, điều kiện và trạng thái vận hành.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-extrabold text-gray-400 tracking-wider">Mã CODE</label>
              <input
                type="text"
                placeholder="VÍ DỤ: SUMMER2024"
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-700"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[11px] uppercase font-extrabold text-gray-400 tracking-wider">Tên chương trình hiển thị</label>
              <input
                type="text"
                placeholder="Nhập tên chương trình khuyến mãi..."
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-extrabold text-gray-400 tracking-wider">Loại giảm</label>
              <select
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
              >
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Cố định (VNĐ)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-extrabold text-gray-400 tracking-wider">Giá trị</label>
              <input
                type="number"
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-extrabold text-gray-400 tracking-wider">Trạng thái</label>
              <select
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Tạm dừng</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-extrabold text-gray-400 tracking-wider">Khách tối thiểu</label>
              <input
                type="number"
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none"
                value={formData.minTravelers}
                onChange={(e) => setFormData({ ...formData, minTravelers: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-extrabold text-gray-400 tracking-wider">Thời gian bắt đầu</label>
              <input
                type="datetime-local"
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none"
                value={formData.startsAt}
                onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-extrabold text-gray-400 tracking-wider">Thời gian kết thúc</label>
              <input
                type="datetime-local"
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none"
                value={formData.endsAt}
                onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-10 flex justify-end gap-4 border-t border-gray-50">
            <button
              type="button"
              onClick={() => navigate('/admin/promotions')}
              className="px-8 py-3 rounded-xl font-bold text-gray-400 hover:text-slate-600 hover:bg-gray-50 transition-all"
            >
              Hủy bỏ thay đổi
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-10 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${
                loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-100'
              }`}
            >
              {loading ? (
                'Đang lưu...'
              ) : (
                isEditMode ? 'Xác nhận cập nhật' : 'Tạo mã mới'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminPromotionFormPage;