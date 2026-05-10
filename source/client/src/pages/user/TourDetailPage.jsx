import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SectionHeading from '../../components/SectionHeading.jsx';
import { getTourDetail } from '../../services/user/tourService.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { handleTourImageError } from '../../utils/tourImageFallback.js';

/**
 * Trang chi tiết tour, lấy dữ liệu trực tiếp từ backend để hiển thị lịch trình và lịch khởi hành.
 */
function TourDetailPage() {
  const { tourId } = useParams();
  const [tour, setTour] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    /**
     * Nạp chi tiết tour theo id trên URL mỗi khi người dùng đổi sang tour khác.
     */
    async function loadTour() {
      try {
        const data = await getTourDetail(tourId);
        setTour(data);
        setErrorMessage('');
      } catch (error) {
        setTour(null);
        setErrorMessage(error.message);
      }
    }

    loadTour();
  }, [tourId]);

  if (!tour) {
    return (
      <div className="container empty-panel">
        <h2>{errorMessage || 'Không tìm thấy tour'}</h2>
        <Link className="button button-primary" to="/tours">
          Quay lại danh sách tour
        </Link>
      </div>
    );
  }

  return (
    <div className="container page-stack">
      <section className="detail-hero">
        <img alt={tour.title} className="detail-cover" src={tour.image} onError={handleTourImageError} />
        <div className="detail-summary">
          <p className="section-eyebrow">{tour.category}</p>
          <h1>{tour.title}</h1>
          <p>{tour.description}</p>
          <div className="chip-row">
            <span className="chip">{tour.location}</span>
            <span className="chip">{tour.duration}</span>
            <span className="chip">Khởi hành từ {tour.departurePoint}</span>
            <span className="chip">{tour.rating}/5 đánh giá</span>
          </div>
          <div className="detail-actions">
            <Link className="button button-primary" to={`/booking/${tour.id}`}>
              Đặt tour ngay
            </Link>
            <Link className="button button-secondary" to="/tours">
              Xem tour khác
            </Link>
          </div>
        </div>
      </section>

      <section className="detail-grid">
        <div className="content-card">
          <SectionHeading
            eyebrow="Điểm nhấn tour"
            title="Những trải nghiệm nổi bật"
            description="Từ cảnh sắc, điểm check-in đến nhịp nghỉ dưỡng, đây là những điều khiến hành trình này luôn được nhiều du khách ưu tiên lựa chọn."
          />
          <div className="chip-row">
            {tour.highlights.map((item) => (
              <span className="chip chip-solid" key={item}>
                {item}
              </span>
            ))}
          </div>
        </div>

        <aside className="sidebar-card">
          <small>Giá bắt đầu</small>
          <h2>{formatCurrency(tour.price)}</h2>
          <p>Chi phí đã bao gồm nhiều tiện ích thiết yếu để bạn an tâm lên kế hoạch và chốt lịch khởi hành phù hợp.</p>
          <ul className="detail-list">
            {tour.inclusions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="content-card">
        <SectionHeading
          eyebrow="Lịch trình tour"
          title="Theo dõi hành trình từng ngày"
          description="Lịch trình được sắp xếp rõ ràng để bạn dễ hình dung nhịp di chuyển, thời gian nghỉ ngơi và các điểm dừng nổi bật trong suốt chuyến đi."
        />
        <div className="itinerary-list">
          {tour.itinerary.map((item) => (
            <article className="itinerary-card" key={item.day}>
              <strong>{item.day}</strong>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-card">
        <SectionHeading
          eyebrow="Lịch khởi hành"
          title="Lựa chọn ngày đi phù hợp"
          description="Chọn đợt khởi hành phù hợp với lịch cá nhân và ưu tiên giữ chỗ sớm ở những ngày đi đang được quan tâm nhiều."
        />
        <div className="departure-grid">
          {tour.departures.map((item) => (
            <article className="departure-card" key={item.id}>
              <span className="status-pill payment-waiting">{item.label}</span>
              <h3>{formatDate(item.date)}</h3>
              <p>Còn {item.slots} chỗ trong đợt này</p>
              <strong>{formatCurrency(item.price)}</strong>
              <Link className="button button-secondary" to={`/booking/${tour.id}`}>
                Chọn lịch này
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default TourDetailPage;
