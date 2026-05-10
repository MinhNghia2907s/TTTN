import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionHeading from '../../components/SectionHeading.jsx';
import { ADMIN_PERMISSION_KEYS, getStoredAdminUser, hasAdminPermission } from '../../services/admin/adminAuthService.js';
import { getAdminMeta } from '../../services/admin/adminMetaService.js';
import {
  downloadTourImportTemplate,
  getAdminTours,
  importAdminToursFromExcel,
  toggleAdminTourDeleteFlag,
  updateAdminTourStatus,
} from '../../services/admin/adminTourService.js';
import { formatCurrency } from '../../utils/formatters.js';
import { getAdminTourBadgeClass, getAdminTourStatusLabel } from '../../utils/adminFormatters.js';

const EMPTY_ADMIN_META = {
  categoryOptions: [],
  tourStatusOptions: [],
};

/**
 * Mỗi trạng thái tour có một thao tác nhanh chính để admin thao tác trực tiếp từ danh sách.
 */
function getQuickStatusAction(status) {
  if (status === 'draft') {
    return { label: 'Mở bán', nextStatus: 'published' };
  }

  if (status === 'archived') {
    return { label: 'Mở lại', nextStatus: 'published' };
  }

  return { label: 'Tạm ẩn', nextStatus: 'archived' };
}

/**
 * Lọc tour theo từ khóa, trạng thái và category đang chọn trên UI.
 */
function filterTours(tourList, searchKeyword, statusFilter, categoryFilter) {
  const normalizedKeyword = searchKeyword.trim().toLowerCase();

  return tourList.filter((tour) => {
    const matchesKeyword =
      !normalizedKeyword ||
      tour.title.toLowerCase().includes(normalizedKeyword) ||
      tour.location.toLowerCase().includes(normalizedKeyword) ||
      String(tour.id).includes(normalizedKeyword);
    const matchesStatus = statusFilter === 'all' || tour.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || tour.category === categoryFilter;

    return matchesKeyword && matchesStatus && matchesCategory;
  });
}

/**
 * Gom các chỉ số để phần JSX phía dưới chỉ việc hiển thị.
 */
function buildTourListSummary(filteredTours) {
  const publishedTours = filteredTours.filter((tour) => tour.status === 'published' && !tour.deleteFlg);
  const draftTours = filteredTours.filter((tour) => tour.status === 'draft');
  const archivedTours = filteredTours.filter((tour) => tour.status === 'archived' || tour.deleteFlg);
  const limitedTours = filteredTours.filter(
    (tour) => !tour.deleteFlg && tour.totalDepartures > 0 && tour.remainingSeats <= 10,
  );
  const averagePrice = filteredTours.length
    ? Math.round(filteredTours.reduce((sum, tour) => sum + tour.price, 0) / filteredTours.length)
    : null;

  return {
    archivedTours,
    averagePrice,
    draftTours,
    limitedTours,
    publishedTours,
  };
}

/**
 * Danh sách tour cho admin, tập trung vào danh mục bán hàng và tình trạng lịch khởi hành.
 */
function AdminTourListPage() {
  const currentAdmin = getStoredAdminUser();
  const canCreateTours = hasAdminPermission(ADMIN_PERMISSION_KEYS.TOURS_CREATE, currentAdmin);
  const canDeleteTours = hasAdminPermission(ADMIN_PERMISSION_KEYS.TOURS_DELETE, currentAdmin);
  const [tourList, setTourList] = useState([]);
  const [adminMeta, setAdminMeta] = useState(EMPTY_ADMIN_META);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [importErrorMessage, setImportErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const importFileInputRef = useRef(null);

  useEffect(() => {
    loadTours();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('modal-scroll-locked', isImportModalOpen);
    document.body.classList.toggle('modal-scroll-locked', isImportModalOpen);

    return () => {
      document.documentElement.classList.remove('modal-scroll-locked');
      document.body.classList.remove('modal-scroll-locked');
    };
  }, [isImportModalOpen]);

  /**
   * Tải danh sách tour để KPI và bảng luôn dùng cùng một nguồn dữ liệu.
   */
  async function loadTours() {
    setIsLoading(true);

    try {
      const [tours, meta] = await Promise.all([getAdminTours(), getAdminMeta()]);
      setTourList(tours);
      setAdminMeta({
        categoryOptions: meta.categoryOptions ?? [],
        tourStatusOptions: meta.tourStatusOptions ?? [],
      });
      setErrorMessage('');
      setSuccessMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Đổi nhanh trạng thái mở bán hoặc tạm ẩn cho tour.
   */
  async function handleQuickStatusChange(tour) {
    const quickAction = getQuickStatusAction(tour.status);

    try {
      const updatedTour = await updateAdminTourStatus(tour.id, quickAction.nextStatus);
      setTourList((currentTours) => currentTours.map((item) => (item.id === tour.id ? updatedTour : item)));
      setErrorMessage('');
      setSuccessMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  /**
   * Xóa mềm hoặc khôi phục tour ngay từ danh sách.
   */
  async function handleToggleDelete(tour) {
    const shouldContinue = window.confirm(
      tour.deleteFlg ? 'Bạn muốn khôi phục tour này?' : 'Bạn muốn đánh dấu xóa mềm tour này?',
    );

    if (!shouldContinue) {
      return;
    }

    try {
      const updatedTour = await toggleAdminTourDeleteFlag(tour.id);
      setTourList((currentTours) => currentTours.map((item) => (item.id === tour.id ? updatedTour : item)));
      setErrorMessage('');
      setSuccessMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  /**
   * Tải file Excel mẫu và tạo link download tạm thời trên trình duyệt.
   */
  async function handleDownloadTemplate() {
    try {
      const blob = await downloadTourImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = 'mau_import_tour.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  /**
   * Trước khi gửi file lên backend, hỏi xác nhận để tránh admin import nhầm file.
   */
  async function handleImportExcel() {
    if (!importFile) {
      setImportErrorMessage('Vui lòng chọn file Excel trước khi import.');
      return;
    }

    const shouldImport = window.confirm(`Bạn có chắc muốn import file "${importFile.name}" không?`);

    if (!shouldImport) {
      return;
    }

    setIsImporting(true);
    setImportErrorMessage('');
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await importAdminToursFromExcel(importFile);
      setImportFile(null);
      setIsImportModalOpen(false);
      await loadTours();
      setSuccessMessage(`Import thành công ${result.importedCount} tour.`);
    } catch (error) {
      setImportErrorMessage(error.message);
    } finally {
      setIsImporting(false);
    }
  }

  /**
   * Xóa file đã chọn khi admin upload nhầm, đồng thời reset input để chọn lại file cũ vẫn kích hoạt onChange.
   */
  function handleClearImportFile() {
    setImportFile(null);
    setImportErrorMessage('');

    if (importFileInputRef.current) {
      importFileInputRef.current.value = '';
    }
  }

  const filteredTours = useMemo(() => {
    return filterTours(tourList, searchKeyword, statusFilter, categoryFilter);
  }, [categoryFilter, searchKeyword, statusFilter, tourList]);

  const { archivedTours, averagePrice, draftTours, limitedTours, publishedTours } = useMemo(
    () => buildTourListSummary(filteredTours),
    [filteredTours],
  );

  return (
    <div className="page-stack">
      <section className="admin-toolbar-card">
        <div className="admin-toolbar-head">
          <SectionHeading
            eyebrow="Tour"
            title="Điều hành danh mục tour, lịch khởi hành và năng lực phục vụ"
            description="Theo dõi trạng thái mở bán, số kỳ khởi hành đang nhận khách và quỹ chỗ còn lại trên toàn hệ thống."
          />
          <div className="admin-topbar-actions">
            <button className="button button-secondary" type="button" onClick={loadTours}>
              Tải lại dữ liệu
            </button>
            {canCreateTours ? (
              <button className="button button-secondary" type="button" onClick={() => setIsImportModalOpen(true)}>
                Import Excel
              </button>
            ) : null}
            <Link className="button button-primary" to="/admin/tours/new">
              Thêm tour mới
            </Link>
          </div>
        </div>

        <div className="admin-kpi-grid">
          <article className="admin-kpi-card">
            <span>Tour đang hiển thị</span>
            <strong>{filteredTours.length}</strong>
            <div className="admin-kpi-meta">{tourList.length} tour trong hệ thống</div>
          </article>
          <article className="admin-kpi-card">
            <span>Đang mở bán</span>
            <strong>{publishedTours.length}</strong>
            <div className="admin-kpi-meta">{draftTours.length} tour đang ở bản nháp</div>
          </article>
          <article className="admin-kpi-card">
            <span>Cần theo dõi chỗ</span>
            <strong>{limitedTours.length}</strong>
            <div className="admin-kpi-meta">Tour có tổng số chỗ còn lại thấp</div>
          </article>
          <article className="admin-kpi-card">
            <span>Giá trung bình</span>
            <strong>{averagePrice !== null ? formatCurrency(averagePrice) : '--'}</strong>
            <div className="admin-kpi-meta">{archivedTours.length} tour tạm ẩn hoặc xóa mềm</div>
          </article>
        </div>
      </section>

      <section className="admin-toolbar-card">
        <div className="admin-toolbar-grid">
          <div>
            <h3>Bộ lọc và phạm vi báo cáo</h3>
            <p>Lọc theo trạng thái hoặc nhóm tour để tập trung vào đúng danh mục đang cần xử lý.</p>
          </div>
          <div className="admin-results-meta">
            <span className="chip">{publishedTours.length} mở bán</span>
            <span className="chip">{draftTours.length} nháp</span>
            <span className="chip">{archivedTours.length} tạm ẩn</span>
          </div>
        </div>

        <div className="admin-filter-grid admin-filter-grid-wide">
          <label className="form-field">
            <span>Tìm theo tên tour, địa điểm hoặc mã tour</span>
            <input
              placeholder="Ví dụ: Hạ Long hoặc 12"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Trạng thái</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {adminMeta.tourStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Nhóm tour</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              {adminMeta.categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
      {successMessage ? <p className="success-message">{successMessage}</p> : null}

      {isImportModalOpen ? (
        <div className="admin-modal-overlay" role="presentation">
          <section className="admin-modal admin-import-modal" aria-modal="true" role="dialog">
            <div className="admin-import-modal-head">
              <div>
                <p className="section-eyebrow">Import Excel</p>
                <h2>Import nhiều gói tour</h2>
                <p>Tải file mẫu, nhập dữ liệu tour rồi upload lại để import vào hệ thống.</p>
              </div>
            </div>

            <button className="button button-secondary admin-import-template-button" type="button" onClick={handleDownloadTemplate}>
              Tải file mẫu
            </button>

            <label className="admin-import-upload-panel" htmlFor="tour-import-excel-file">
              <div className="admin-import-upload-icon">XLSX</div>
              <div>
                <h3>Upload file Excel</h3>
                <p>File cần có 3 sheet: Tours, Departures và Itineraries.</p>
                <input
                  accept=".xlsx,.xls"
                  className="admin-import-file-input"
                  id="tour-import-excel-file"
                  ref={importFileInputRef}
                  type="file"
                  onChange={(event) => {
                    setImportFile(event.target.files?.[0] ?? null);
                    setImportErrorMessage('');
                  }}
                />
              </div>
            </label>

            <div className={importFile ? 'admin-import-file-card is-ready' : 'admin-import-file-card'}>
              <div>
                <span>{importFile ? 'File đã chọn' : 'Chưa chọn file'}</span>
                <strong>{importFile?.name || 'Chọn file .xlsx hoặc .xls để import'}</strong>
              </div>
              {importFile ? (
                <button
                  aria-label="Xóa file đã chọn"
                  className="admin-import-clear-file"
                  title="Xóa file đã chọn"
                  type="button"
                  onClick={handleClearImportFile}
                >
                  ×
                </button>
              ) : null}
            </div>

            {importErrorMessage ? <p className="error-message">{importErrorMessage}</p> : null}

            <div className="admin-form-actions">
              <button className="button button-primary" disabled={isImporting} type="button" onClick={handleImportExcel}>
                {isImporting ? 'Đang import...' : 'Import'}
              </button>
              <button className="button button-secondary" type="button" onClick={() => setIsImportModalOpen(false)}>
                Hủy
              </button>
            </div>

          </section>
        </div>
      ) : null}

      <section className="admin-report-card">
        <div className="admin-table-caption">
          <div>
            <h2>Danh sách tour</h2>
            <p className="helper-text">Từ bảng này bạn có thể cập nhật cấu hình tour, điều chỉnh trạng thái bán và kiểm soát vòng đời dữ liệu.</p>
          </div>
          <div className="admin-results-meta">
            <span className="chip">{filteredTours.length} kết quả</span>
            <span className="chip">{limitedTours.length} tour ít chỗ</span>
          </div>
        </div>

        {isLoading ? (
          <p className="helper-text">Đang tải danh sách tour...</p>
        ) : filteredTours.length ? (
          <div className="admin-table-shell">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tour</th>
                  <th>Nhóm</th>
                  <th>Giá</th>
                  <th>Lịch khởi hành</th>
                  <th>Trạng thái</th>
                  <th>Cập nhật</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredTours.map((tour) => {
                  /**
                   * Quick action được tính theo từng dòng để nút hiển thị đúng
                   * với trạng thái hiện tại của tour tại thời điểm render.
                   */
                  const quickAction = getQuickStatusAction(tour.status);

                  return (
                    <tr key={tour.id}>
                      <td data-label="Tour">
                        <div className="admin-table-user">
                          <strong>{tour.title}</strong>
                          <span>#{tour.id}</span>
                          <p>{tour.location}</p>
                        </div>
                      </td>
                      <td data-label="Nhóm">
                        <div className="admin-table-meta">
                          <span>{tour.category}</span>
                          <span>{tour.durationDays} ngày</span>
                        </div>
                      </td>
                      <td data-label="Giá">{formatCurrency(tour.price)}</td>
                      <td data-label="Lịch khởi hành">
                        <div className="admin-table-meta">
                          <span>{tour.openDepartures}/{tour.totalDepartures} đợt đang mở</span>
                          <span>Còn {tour.remainingSeats} chỗ</span>
                        </div>
                      </td>
                      <td data-label="Trạng thái">
                        <span className={getAdminTourBadgeClass(tour.status, tour.deleteFlg)}>
                          {tour.deleteFlg ? 'Đã xóa mềm' : getAdminTourStatusLabel(tour.status)}
                        </span>
                      </td>
                      <td data-label="Cập nhật">{new Date(tour.updatedAt).toLocaleDateString('vi-VN')}</td>
                      <td data-label="Thao tác">
                        <div className="admin-table-actions">
                          <Link className="button button-secondary" to={`/admin/tours/${tour.id}/edit`}>
                            Chỉnh sửa
                          </Link>
                          <button className="button button-ghost" type="button" onClick={() => handleQuickStatusChange(tour)}>
                            {quickAction.label}
                          </button>
                          {canDeleteTours ? (
                            <button
                              className={tour.deleteFlg ? 'button button-success' : 'button button-danger'}
                              type="button"
                              onClick={() => handleToggleDelete(tour)}
                            >
                              {tour.deleteFlg ? 'Khôi phục' : 'Xóa mềm'}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-state">
            <h3>Không có tour nào phù hợp bộ lọc</h3>
            <p>Thử đổi từ khóa, trạng thái hoặc nhóm tour để mở rộng danh mục đang xem.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminTourListPage;
