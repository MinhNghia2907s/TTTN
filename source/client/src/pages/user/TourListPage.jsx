import { useEffect, useMemo, useState } from 'react';
import SectionHeading from '../../components/SectionHeading.jsx';
import TourCard from '../../components/TourCard.jsx';
import { getAllTours } from '../../services/user/tourService.js';

function getItemsPerPage(width) {
  if (width >= 1180) {
    return 12;
  }

  if (width >= 900) {
    return 9;
  }

  if (width >= 600) {
    return 6;
  }

  return 4;
}

/**
 * Trang danh sách tour, hỗ trợ tìm kiếm theo từ khóa và lọc theo nhóm tour.
 */
function TourListPage() {
  const [tours, setTours] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => getItemsPerPage(window.innerWidth));

  useEffect(() => {
    /**
     * Lấy toàn bộ danh sách tour từ backend khi trang được mở.
     */
    async function loadTours() {
      try {
        const data = await getAllTours();
        setTours(data);
        setErrorMessage('');
      } catch (error) {
        setErrorMessage(error.message);
      }
    }

    loadTours();
  }, []);

  useEffect(() => {
    /**
     * Đồng bộ số tour mỗi trang theo số cột hiển thị thực tế để danh sách luôn gọn trên từng kích thước màn hình.
     */
    function syncItemsPerPage() {
      setItemsPerPage(getItemsPerPage(window.innerWidth));
    }

    window.addEventListener('resize', syncItemsPerPage);
    return () => window.removeEventListener('resize', syncItemsPerPage);
  }, []);

  // Sinh danh sách category động từ dữ liệu tour để bộ lọc không phải hard-code.
  const categories = useMemo(() => ['all', ...new Set(tours.map((tour) => tour.category))], [tours]);

  // Kết hợp cả từ khóa và category để danh sách hiển thị phản ánh đúng bộ lọc người dùng chọn.
  const filteredTours = useMemo(() => {
    return tours.filter((tour) => {
      const matchesKeyword =
        tour.title.toLowerCase().includes(keyword.toLowerCase()) ||
        tour.location.toLowerCase().includes(keyword.toLowerCase());
      const matchesCategory = category === 'all' || tour.category === category;

      return matchesKeyword && matchesCategory;
    });
  }, [category, keyword, tours]);

  const totalPages = Math.max(1, Math.ceil(filteredTours.length / itemsPerPage));
  const paginatedTours = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTours.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredTours, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [category, keyword, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startItem = filteredTours.length ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, filteredTours.length);

  return (
    <div className="container page-stack">
      <section className="page-banner">
        <SectionHeading
          eyebrow="Danh sách tour"
          title="Chọn hành trình phù hợp cho kỳ nghỉ bạn đang mong chờ"
          description="Tìm theo điểm đến, cảm hứng du lịch hoặc nhóm trải nghiệm để nhanh chóng thấy những tour phù hợp với lịch trình và ngân sách của bạn."
        />
      </section>

      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

      <section className="filters-panel">
        <label className="form-field">
          <span>Tìm theo tên tour hoặc địa điểm</span>
          <input
            placeholder="Ví dụ: Sa Pa, Phú Quốc..."
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </label>

        <label className="form-field">
          <span>Loại tour</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? 'Tất cả' : item}
              </option>
            ))}
          </select>
        </label>
      </section>

      {filteredTours.length ? (
        <>
          <section className="section-heading-row tour-list-toolbar">
            <p className="helper-text">
              Hiển thị {startItem}-{endItem} trên tổng số {filteredTours.length} tour phù hợp.
            </p>
            <p className="helper-text">
              Trang {currentPage}/{totalPages}
            </p>
          </section>

          <section className="card-grid tour-list-grid">
            {paginatedTours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </section>

          {totalPages > 1 ? (
            <section className="pagination-bar">
              <button
                className="button button-secondary"
                disabled={currentPage === 1}
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Trang trước
              </button>

              <div className="pagination-pages">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    className={pageNumber === currentPage ? 'pagination-page active' : 'pagination-page'}
                    type="button"
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>

              <button
                className="button button-secondary"
                disabled={currentPage === totalPages}
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                Trang sau
              </button>
            </section>
          ) : null}
        </>
      ) : (
        <section className="empty-panel">
          <h2>Chưa tìm thấy tour phù hợp</h2>
          <p className="helper-text">Hãy thử đổi từ khóa tìm kiếm hoặc chọn lại nhóm trải nghiệm để xem thêm gợi ý khác.</p>
        </section>
      )}
    </div>
  );
}

export default TourListPage;
