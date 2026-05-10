import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminPromotionService } from '../../services/admin/adminPromotionService';
import SectionHeading from '../../components/SectionHeading.jsx';

function AdminPromotionListPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  // --- LOGIC THỐNG KÊ ---
  const countTotal = promotions.length;
  const countActive = promotions.filter(p => p.status === 'active').length;
  const totalUsed = promotions.reduce((sum, item) => sum + (Number(item.usedCount) || 0), 0);
  const totalDiscountAmount = promotions.reduce((sum, item) => sum + (Number(item.totalDiscountedAmount) || 0), 0);

  const filteredData = promotions.filter(item => {
    const matchSearch = item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchType = typeFilter === 'all' || item.discountType === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mã khuyến mãi này không?')) {
      try {
        const res = await adminPromotionService.deletePromotion(id);
        if (res.success) fetchPromotions();
      } catch (error) {
        alert("Xóa không thành công.");
      }
    }
  };

  return (
    <div className="page-stack font-sans text-slate-700">
      {/* 1. HEADER & KPI - ĐÃ CHỈNH SỬA NÚT THÊM MỚI */}
      <section className="admin-toolbar-card">
        <div className="admin-toolbar-head">
          <SectionHeading
            eyebrow="Khuyến mãi"
            title="Điều hành chương trình, mã giảm giá và ưu đãi"
            description="Theo dõi hiệu quả và quản lý các chiến dịch marketing, mã giảm giá hệ thống."
          />
          <div className="flex gap-3">
            <button className="button button-secondary" type="button" onClick={fetchPromotions}>
              Tải lại dữ liệu
            </button>
            
            {/* NÚT THÊM MỚI: Đã bỏ SVG icon, dùng class button-primary chuẩn */}
            <button 
              className="button button-primary" 
              onClick={() => navigate('/admin/promotions/new')}
            >
              Thêm mã mới
            </button>
          </div>
        </div>
        
        <div className="admin-kpi-grid">
          <article className="admin-kpi-card">
            <span>Tổng chương trình</span>
            <strong className="text-slate-800">{countTotal}</strong>
            <div className="admin-kpi-meta">Mã trong hệ thống</div>
          </article>
          <article className="admin-kpi-card">
            <span>Đang hoạt động</span>
            <strong className="text-green-600">{countActive}</strong>
            <div className="admin-kpi-meta">Chiến dịch đang chạy</div>
          </article>
          <article className="admin-kpi-card">
            <span>Lượt sử dụng</span>
            <strong className="text-slate-800">{totalUsed.toLocaleString()}</strong>
            <div className="admin-kpi-meta">Tổng lượt đã áp dụng</div>
          </article>
          <article className="admin-kpi-card">
            <span>Tổng tiền đã giảm</span>
            <strong className="text-orange-500">{totalDiscountAmount.toLocaleString()} đ</strong>
            <div className="admin-kpi-meta">Dựa trên doanh thu thực tế</div>
          </article>
        </div>
      </section>

      {/* 2. BỘ LỌC */}
      <section className="admin-toolbar-card">
        <div className="admin-toolbar-grid">
          <div>
            <h3 className="font-bold text-slate-700">Bộ lọc đối soát</h3>
            <p className="text-sm text-slate-500">Lọc theo trạng thái hoặc loại giảm giá để quản lý danh sách.</p>
          </div>
        </div>

        <div className="admin-filter-grid admin-filter-grid-wide mt-4">
          <label className="form-field">
            <span className="text-slate-400 font-bold uppercase text-[11px]">Tìm theo tên hoặc mã code</span>
            <input 
              placeholder="Ví dụ: GIAMHE2024..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </label>

          <label className="form-field">
            <span className="text-slate-400 font-bold uppercase text-[11px]">Loại giảm giá</span>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">Tất cả loại</option>
              <option value="percent">Phần trăm (%)</option>
              <option value="fixed">Cố định (VNĐ)</option>
            </select>
          </label>

          <label className="form-field">
            <span className="text-slate-400 font-bold uppercase text-[11px]">Trạng thái</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm dừng</option>
            </select>
          </label>
        </div>
      </section>

      {/* 3. BẢNG DANH SÁCH */}
      <section className="admin-report-card">
        <div className="admin-table-caption">
          <div>
            <h2 className="text-slate-800 font-bold">Danh sách khuyến mãi</h2>
            <p className="helper-text text-slate-500">Truy cập nhanh để chỉnh sửa nội dung hoặc thay đổi trạng thái mã.</p>
          </div>
          <div className="admin-results-meta">
            <span className="chip text-slate-500">{filteredData.length} kết quả</span>
          </div>
        </div>

        <div className="admin-table-shell">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="text-slate-400 font-bold uppercase text-[11px]">Mã (Code)</th>
                <th className="text-slate-400 font-bold uppercase text-[11px]">Tên chương trình</th>
                <th className="text-slate-400 font-bold uppercase text-[11px] text-center">Mức giảm</th>
                <th className="text-slate-400 font-bold uppercase text-[11px] text-center">Trạng thái</th>
                <th className="text-slate-400 font-bold uppercase text-[11px] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="p-10 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
              ) : filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td>
                    <span className="font-mono font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-[12px]">
                      {item.code}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table-user">
                      <strong className="text-slate-700">{item.name}</strong>
                    </div>
                  </td>
                  <td className="text-center">
                    <span className="text-green-600 font-bold">
                      {item.discountType === 'percent' ? `${item.discountValue}%` : `${Number(item.discountValue).toLocaleString()}đ`}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`px-4 py-1 rounded-full text-[11px] font-bold ${item.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {item.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <Link 
                        className="button button-secondary" 
                        to={`/admin/promotions/edit/${item.id}`}
                      >
                        Chỉnh sửa
                      </Link>
                      <button
                        className="button button-danger font-bold"
                        type="button"
                        onClick={() => handleDelete(item.id)}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default AdminPromotionListPage;