import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminPromotionService } from '../../services/admin/adminPromotionService';

function AdminPromotionListPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // State dành cho bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const res = await adminPromotionService.getPromotions();
      if (res.success) {
        setPromotions(res.data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách khuyến mãi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  // Xử lý lọc dữ liệu
  const filteredData = promotions.filter(item => {
    const matchSearch = item.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchType = typeFilter === 'all' || item.discountType === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  // Tính toán số lượng cho Badge
  const countActive = promotions.filter(p => p.status === 'active').length;
  const countInactive = promotions.filter(p => p.status === 'inactive').length;

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mã khuyến mãi này không?')) {
      try {
        const res = await adminPromotionService.deletePromotion(id);
        if (res.success) {
          fetchPromotions();
        }
      } catch (error) {
        alert("Xóa không thành công.");
      }
    }
  };

  return (
    <div className="admin-content p-8 bg-[#f8f9fa] min-h-screen">
      {/* 1. HEADER SECTION */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <span className="text-[12px] uppercase font-bold text-gray-400 tracking-[0.2em]">Khuyến mãi</span>
          <h1 className="text-3xl font-light text-slate-800 mt-1">
            Điều hành chương trình, mã giảm giá và ưu đãi
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Theo dõi hiệu quả, trạng thái sử dụng và quản lý các chiến dịch marketing.
          </p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={fetchPromotions}
            className="px-6 py-2.5 bg-white border border-gray-100 rounded-2xl font-bold text-slate-600 shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            Tải lại dữ liệu
          </button>
          <button 
            onClick={() => navigate('/admin/promotions/new')}
            className="px-6 py-2.5 bg-orange-500 rounded-2xl font-bold text-white shadow-lg shadow-orange-200 hover:bg-orange-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Thêm mã mới
          </button>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Tổng chương trình', value: promotions.length, sub: 'Mã mới trong tháng này' },
          { label: 'Đang hoạt động', value: countActive, sub: '85% hiệu suất lọc', color: 'text-green-500' },
          { label: 'Lượt sử dụng', value: '1,240', sub: 'Tăng 12% so với tuần trước' },
          { label: 'Tổng tiền đã giảm', value: '15.400.000 đ', sub: 'Dựa trên doanh thu thực tế', color: 'text-orange-500' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[28px] shadow-sm border border-white/60">
            <p className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">{stat.label}</p>
            <h3 className={`text-3xl font-bold mt-2 ${stat.color || 'text-slate-800'}`}>{stat.value}</h3>
            <p className="text-[10px] mt-2 bg-gray-50 text-gray-400 py-1 px-3 rounded-full inline-block font-medium">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* 3. BỘ LỌC (GIỐNG ẢNH MẪU) */}
      <div className="bg-white p-8 rounded-[28px] shadow-sm border border-white/60 mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-bold text-slate-700">Bộ lọc và phạm vi thống kê</h3>
            <p className="text-xs text-gray-400 mt-1">Lọc theo mã code, trạng thái hoặc loại giảm giá để tập trung rà soát.</p>
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] font-bold bg-green-50 text-green-600 px-3 py-1 rounded-full uppercase">{countActive} Hoạt động</span>
            <span className="text-[10px] font-bold bg-gray-50 text-gray-400 px-3 py-1 rounded-full uppercase">{countInactive} Tạm dừng</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className="text-[11px] uppercase font-extrabold text-gray-400 tracking-wider">Tìm theo tên hoặc mã code</label>
            <input
              type="text"
              placeholder="Ví dụ: GIAMHE2024..."
              className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] uppercase font-extrabold text-gray-400 tracking-wider">Loại giảm giá</label>
            <select 
              className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-slate-600"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tất cả loại</option>
              <option value="percent">Phần trăm (%)</option>
              <option value="fixed">Cố định (VNĐ)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] uppercase font-extrabold text-gray-400 tracking-wider">Trạng thái</label>
            <select 
              className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-slate-600"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm dừng</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. BẢNG DANH SÁCH */}
      <div className="bg-white rounded-[28px] shadow-sm border border-white/60 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400">
              <th className="p-6 font-bold uppercase text-[11px] tracking-wider">Mã (Code)</th>
              <th className="p-6 font-bold uppercase text-[11px] tracking-wider">Tên chương trình</th>
              <th className="p-6 font-bold uppercase text-[11px] tracking-wider text-center">Mức giảm</th>
              <th className="p-6 font-bold uppercase text-[11px] tracking-wider text-center">Trạng thái</th>
              <th className="p-6 font-bold uppercase text-[11px] tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan="5" className="p-10 text-center text-slate-400">Đang đồng bộ dữ liệu...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan="5" className="p-10 text-center text-slate-400">Không tìm thấy mã nào phù hợp.</td></tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-6">
                    <span className="font-mono font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-xl text-sm">
                      {item.code}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="font-bold text-slate-700">{item.name}</div>
                  </td>
                  <td className="p-6 text-center">
                    <span className="text-green-500 font-extrabold">
                      {item.discountType === 'percent' ? `${item.discountValue}%` : `${Number(item.discountValue).toLocaleString()}đ`}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    <span className={`px-4 py-1 rounded-full text-[11px] font-bold ${
                      item.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {item.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-4">
                      <button 
                        onClick={() => navigate(`/admin/promotions/edit/${item.id}`)}
                        className="text-sm font-bold text-slate-600 hover:text-orange-500 transition-all"
                      >
                        Sửa
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-sm font-bold text-gray-300 hover:text-red-500 transition-all"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminPromotionListPage;