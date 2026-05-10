import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FormField from '../../components/FormField.jsx';
import { createBooking, quoteBooking } from '../../services/user/bookingService.js';
import { getStoredUser, logout } from '../../services/user/authService.js';
import { getTourDetail } from '../../services/user/tourService.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

function getTravelerCount(value) {
  const travelerCount = Number.parseInt(value, 10);
  return Number.isFinite(travelerCount) && travelerCount >= 1 ? travelerCount : 1;
}

/**
 * Trang nhập thông tin đặt tour và tạo booking thật trước khi sang bước thanh toán.
 */
function BookingPage() {
  const { tourId } = useParams();
  const navigate = useNavigate();
  const storedUser = getStoredUser();
  const [tour, setTour] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApplyingPromotion, setIsApplyingPromotion] = useState(false);
  const [promotionMessage, setPromotionMessage] = useState('');
  const [promotionMessageType, setPromotionMessageType] = useState('success');
  const [priceQuote, setPriceQuote] = useState(null);
  const [formData, setFormData] = useState({
    fullName: storedUser?.fullName || '',
    email: storedUser?.email || '',
    phone: storedUser?.phone || '',
    travelerCount: '1',
    departureId: '',
    promotionCode: '',
    note: '',
  });

  useEffect(() => {
    /**
     * Lấy dữ liệu tour và tự động chọn lịch khởi hành đầu tiên để form có trạng thái mặc định hợp lệ.
     */
    async function loadTour() {
      try {
        const data = await getTourDetail(tourId);
        setTour(data);
        setErrorMessage('');

        if (data?.departures?.[0]) {
          setFormData((current) => ({
            ...current,
            departureId: current.departureId || data.departures[0].id,
          }));
        }
      } catch (error) {
        setErrorMessage(error.message);
      }
    }

    loadTour();
  }, [tourId]);

  // Xác định lịch khởi hành đang được chọn để hiển thị đúng ngày đi và giá tour.
  const selectedDeparture = useMemo(() => {
    return tour?.departures.find((item) => item.id === formData.departureId);
  }, [formData.departureId, tour]);

  // Tổng tiền tạm tính được suy ra trực tiếp từ số khách và giá của lịch đang chọn.
  const travelerCount = getTravelerCount(formData.travelerCount);
  const fallbackSubtotalPrice = travelerCount * (selectedDeparture?.price ?? 0);
  const priceSummary = priceQuote ?? {
    discountAmount: 0,
    promotionCode: null,
    subtotalPrice: fallbackSubtotalPrice,
    totalPrice: fallbackSubtotalPrice,
  };

  /**
   * Đồng bộ giá trị input vào form state để dùng lại cho bước thanh toán.
   */
  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));

    // Khi đổi số khách, lịch đi hoặc mã, kết quả quote cũ không còn chắc đúng nữa.
    if (['travelerCount', 'departureId', 'promotionCode'].includes(name)) {
      setPriceQuote(null);
      setPromotionMessage('');
      setPromotionMessageType('success');
    }
  }

  function handleTravelerCountBlur() {
    setFormData((current) => ({
      ...current,
      travelerCount: String(getTravelerCount(current.travelerCount)),
    }));
  }

  /**
   * Gọi backend để kiểm tra mã khuyến mãi.
   * Backend sẽ quyết định mã có hợp lệ không và trả về tổng tiền sau giảm.
   */
  async function handleApplyPromotion() {
    const normalizedPromotionCode = formData.promotionCode.trim();

    if (!normalizedPromotionCode) {
      setPriceQuote(null);
      setPromotionMessage('Nhập mã khuyến mãi nếu bạn có mã.');
      setPromotionMessageType('error');
      setErrorMessage('');
      return;
    }

    setIsApplyingPromotion(true);
    setErrorMessage('');
    setPromotionMessage('');
    setPromotionMessageType('success');

    try {
      const quote = await quoteBooking({
        departureId: formData.departureId,
        promotionCode: normalizedPromotionCode,
        tourId,
        travelers: travelerCount,
      });

      setPriceQuote(quote);
      setPromotionMessage(quote.message);
      setPromotionMessageType('success');
    } catch (error) {
      setPriceQuote(null);

      if (error.status === 401) {
        logout();
        navigate('/login', { replace: true, state: { redirectTo: `/booking/${tourId}` } });
        return;
      }

      setPromotionMessage(error.message);
      setPromotionMessageType('error');
    } finally {
      setIsApplyingPromotion(false);
    }
  }

  /**
   * Tạo booking ở backend rồi điều hướng sang trang thanh toán với booking id thật.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const booking = await createBooking({
        departureId: formData.departureId,
        email: formData.email,
        fullName: formData.fullName,
        note: formData.note,
        phone: formData.phone,
        promotionCode: formData.promotionCode.trim(),
        tourId,
        travelers: travelerCount,
      });

      navigate(`/payment/${booking.id}`);
    } catch (error) {
      if (error.status === 401) {
        logout();
        navigate('/login', { replace: true, state: { redirectTo: `/booking/${tourId}` } });
        return;
      }

      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!tour) {
    return (
      <div className="container empty-panel">
        <h2>{errorMessage || 'Đang tải thông tin tour'}</h2>
      </div>
    );
  }

  return (
    <div className="container page-stack">
      <section className="page-banner">
        <p className="section-eyebrow">Trang đặt tour</p>
        <h1>Giữ chỗ nhanh cho hành trình bạn đã chọn.</h1>
      </section>

      <div className="booking-grid">
        <form className="form-card" onSubmit={handleSubmit}>
          <FormField label="Họ và tên" name="fullName" onChange={handleChange} placeholder="Nguyễn Văn A" value={formData.fullName} />
          <FormField label="Email" name="email" onChange={handleChange} placeholder="you@example.com" type="email" value={formData.email} />
          <FormField label="Số điện thoại" name="phone" onChange={handleChange} placeholder="09xxxxxxxx" value={formData.phone} />
          <FormField
            label="Số lượng hành khách"
            min="1"
            name="travelerCount"
            onChange={handleChange}
            onBlur={handleTravelerCountBlur}
            placeholder="1"
            step="1"
            type="number"
            value={formData.travelerCount}
          />
          <FormField
            as="select"
            label="Lịch khởi hành"
            name="departureId"
            onChange={handleChange}
            options={tour.departures.map((item) => ({
              value: item.id,
              label: `${formatDate(item.date)} - ${item.label} - ${formatCurrency(item.price)}`,
            }))}
            value={formData.departureId}
          />
          <div className="promotion-box">
            <FormField
              label="Mã khuyến mãi"
              name="promotionCode"
              onChange={handleChange}
              placeholder="TOURGROUP10"
              value={formData.promotionCode}
            />
            <button className="button button-secondary" disabled={isApplyingPromotion} type="button" onClick={handleApplyPromotion}>
              {isApplyingPromotion ? 'Đang kiểm tra...' : 'Áp dụng'}
            </button>
          </div>
          {promotionMessage ? (
            <p className={promotionMessageType === 'error' ? 'error-message' : 'success-message'}>{promotionMessage}</p>
          ) : null}
          <FormField
            as="textarea"
            label="Ghi chú thêm"
            name="note"
            onChange={handleChange}
            placeholder="Ví dụ: ăn chay, cần xếp chỗ ngồi..."
            value={formData.note}
          />
          <button className="button button-primary full-width" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Đang giữ chỗ cho bạn...' : 'Tiếp tục đến bước thanh toán'}
          </button>
          {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
        </form>

        <aside className="summary-card">
          <p className="section-eyebrow">Tóm tắt đơn đặt</p>
          <h2>{tour.title}</h2>
          <ul className="detail-list">
            <li>Điểm khởi hành: {tour.departurePoint}</li>
            <li>Thời lượng: {tour.duration}</li>
            <li>Lịch chọn: {selectedDeparture ? formatDate(selectedDeparture.date) : 'Chưa chọn'}</li>
            <li>Số khách: {travelerCount}</li>
          </ul>
          <div className="summary-total">
            <span>Tổng tạm tính</span>
            <strong>{formatCurrency(priceSummary.subtotalPrice)}</strong>
          </div>
          <div className="summary-total summary-total-muted">
            <span>Khuyến mãi{priceSummary.promotionCode ? ` (${priceSummary.promotionCode})` : ''}</span>
            <strong>-{formatCurrency(priceSummary.discountAmount)}</strong>
          </div>
          <div className="summary-total">
            <span>Tổng thanh toán</span>
            <strong>{formatCurrency(priceSummary.totalPrice)}</strong>
          </div>
          <p className="helper-text">Thông tin của bạn sẽ được dùng để giữ chỗ, xác nhận lịch khởi hành và hỗ trợ trước chuyến đi.</p>
        </aside>
      </div>
    </div>
  );
}

export default BookingPage;
