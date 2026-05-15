import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import FormField from '../../components/FormField.jsx';
import { ADMIN_PERMISSION_KEYS, getStoredAdminUser, hasAdminPermission } from '../../services/admin/adminAuthService.js';
import { getAdminMeta } from '../../services/admin/adminMetaService.js';
import {
  createAdminTour,
  getAdminTourDetail,
  toggleAdminTourDeleteFlag,
  updateAdminTour,
} from '../../services/admin/adminTourService.js';
import { formatCurrency } from '../../utils/formatters.js';
import { getAdminDepartureStatusLabel, getAdminTourStatusLabel } from '../../utils/adminFormatters.js';

const DEFAULT_TOUR_DURATION_DAYS = 3;
const DEFAULT_DEPARTURE_SEATS = 20;
const EMPTY_ADMIN_META = {
  departureStatusOptions: [],
  editableTourStatusOptions: [],
};

/**
 * Tách dữ liệu từ textarea nhiều dòng thành mảng string sạch để gửi lên API.
 */
function splitTextareaLines(value) {
  return String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Tạo một ngày lịch trình rỗng cho UI.
 * Hàm này được dùng cả khi khởi tạo form mới và khi người dùng bấm "Thêm ngày mới".
 */
function createEmptyItineraryItem(dayNumber) {
  return {
    dayNumber,
    description: '',
    title: '',
  };
}

/**
 * Tạo một lịch khởi hành rỗng với số chỗ mặc định để admin có khung nhập ngay.
 */
function createEmptyDepartureItem(index) {
  return {
    date: '',
    departureCode: `DEP-DRAFT-${index}`,
    labelText: '',
    price: 0,
    seatsRemaining: DEFAULT_DEPARTURE_SEATS,
    seatsTotal: DEFAULT_DEPARTURE_SEATS,
    status: 'open',
  };
}

/**
 * State mặc định cho form thêm tour mới.
 */
function createEmptyFormState() {
  return {
    category: '',
    departurePoint: '',
    departures: [createEmptyDepartureItem(1)],
    description: '',
    durationDays: DEFAULT_TOUR_DURATION_DAYS,
    highlightsText: '',
    imageUrl: '',
    inclusionsText: '',
    itinerary: [createEmptyItineraryItem(1)],
    location: '',
    price: 0,
    status: 'draft',
    title: '',
  };
}

/**
 * Đổi 1 departure từ shape backend sang shape UI của form.
 * Backend đã normalize dữ liệu khá nhiều, nhưng ở frontend ta vẫn chuẩn hóa tiếp
 * để mọi field luôn có giá trị fallback rõ ràng.
 */
function mapDepartureToFormState(tour, departure, index) {
  return {
    date: departure.date ?? '',
    departureCode: departure.departureCode ?? `DEP-${tour.id}-${index + 1}`,
    labelText: departure.labelText ?? '',
    price: departure.price ?? tour.price,
    seatsRemaining: departure.seatsRemaining ?? 0,
    seatsTotal: departure.seatsTotal ?? 0,
    status: departure.status ?? 'open',
  };
}

/**
 * Đổi 1 itinerary item từ backend sang state của form.
 */
function mapItineraryToFormState(item, index) {
  return {
    dayNumber: item.dayNumber ?? index + 1,
    description: item.description ?? '',
    title: item.title ?? '',
  };
}

/**
 * Khi sửa tour, form cần được đổ lại từ dữ liệu backend để tránh lệch format
 * giữa state của UI và dữ liệu đang lưu trong database.
 */
function createFormStateFromTour(tour) {
  return {
    category: tour.category ?? '',
    departurePoint: tour.departurePoint ?? '',
    departures: tour.departures?.length
      ? tour.departures.map((departure, index) => mapDepartureToFormState(tour, departure, index))
      : [createEmptyDepartureItem(1)],
    description: tour.description ?? '',
    durationDays: tour.durationDays ?? DEFAULT_TOUR_DURATION_DAYS,
    highlightsText: (tour.highlights ?? []).join('\n'),
    imageUrl: tour.imageUrl ?? '',
    inclusionsText: (tour.inclusions ?? []).join('\n'),
    itinerary: tour.itinerary?.length
      ? tour.itinerary.map((item, index) => mapItineraryToFormState(item, index))
      : [createEmptyItineraryItem(1)],
    location: tour.location ?? '',
    price: tour.price ?? 0,
    status: tour.status ?? 'draft',
    title: tour.title ?? '',
  };
}

/**
 * Gom toàn bộ state của form thành payload backend mong đợi.
 * Đây là điểm "nối" giữa UI state và API nên được giữ riêng để dễ đọc luồng submit:
 * 1. người dùng sửa form
 * 2. formData được map về payload sạch
 * 3. payload gửi sang service create/update
 */
function buildPayload(formData) {
  return {
    category: formData.category,
    departurePoint: formData.departurePoint,
    departures: formData.departures.map((departure, index) => ({
      date: departure.date,
      departureCode: departure.departureCode || `DEP-AUTO-${index + 1}`,
      labelText: departure.labelText,
      price: Number(departure.price) || 0,
      seatsRemaining: Number(departure.seatsRemaining) || 0,
      seatsTotal: Number(departure.seatsTotal) || 0,
      status: departure.status,
    })),
    description: formData.description,
    durationDays: Number(formData.durationDays) || 0,
    highlights: splitTextareaLines(formData.highlightsText),
    imageUrl: formData.imageUrl,
    inclusions: splitTextareaLines(formData.inclusionsText),
    itinerary: formData.itinerary.map((item, index) => ({
      dayNumber: Number(item.dayNumber) || index + 1,
      description: item.description,
      title: item.title,
    })),
    location: formData.location,
    price: Number(formData.price) || 0,
    status: formData.status,
    title: formData.title,
  };
}

/**
 * Tính nhanh các số tổng hợp để hiển thị ở khối tóm tắt bên phải.
 * Việc gom vào helper giúp phần render gọn hơn và nói rõ ý nghĩa của từng con số.
 */
function calculateDepartureSummary(departures) {
  return departures.reduce(
    (summary, departure) => ({
      remainingSeats: summary.remainingSeats + (Number(departure.seatsRemaining) || 0),
      totalSeats: summary.totalSeats + (Number(departure.seatsTotal) || 0),
    }),
    { remainingSeats: 0, totalSeats: 0 },
  );
}

/**
 * Cập nhật một phần tử trong mảng state theo index.
 * Dùng chung cho itinerary/departure để tránh lặp lại logic `map`.
 */
function updateItemAtIndex(items, targetIndex, updater) {
  return items.map((item, index) => (index === targetIndex ? updater(item) : item));
}

/**
 * Form thêm và sửa tour cho admin, bao gồm thông tin tour, lịch trình và lịch khởi hành.
 */
function AdminTourFormPage() {
  const { tourId } = useParams();
  const currentAdmin = getStoredAdminUser();
  const canDeleteTours = hasAdminPermission(ADMIN_PERMISSION_KEYS.TOURS_DELETE, currentAdmin);
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = Boolean(tourId);
  const [adminMeta, setAdminMeta] = useState(EMPTY_ADMIN_META);
  const [formData, setFormData] = useState(createEmptyFormState());
  const [tourDetail, setTourDetail] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage ?? '');
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    /**
     * Metadata admin được tải một lần khi mở trang để cấp option cho các select.
     * Luồng này tách riêng với luồng load tour detail để page thêm mới cũng dùng được.
     */
    async function loadAdminMeta() {
      try {
        const meta = await getAdminMeta();
        setAdminMeta({
          departureStatusOptions: meta.departureStatusOptions ?? [],
          editableTourStatusOptions: meta.editableTourStatusOptions ?? [],
        });
      } catch (error) {
        setErrorMessage(error.message);
      }
    }

    loadAdminMeta();
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    /**
     * Tải dữ liệu tour hiện có để form sửa bám đúng backend.
     */
    async function loadTourDetail() {
      setIsLoading(true);

      try {
        const tour = await getAdminTourDetail(tourId);
        setTourDetail(tour);
        setFormData(createFormStateFromTour(tour));
        setErrorMessage('');
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadTourDetail();
  }, [isEditMode, tourId]);

  useEffect(() => {
    /**
     * Sau khi điều hướng từ màn tạo mới sang màn sửa, ta nhận `successMessage`
     * qua router state. Effect này xóa state đó sau lần render đầu để tránh
     * thông báo cũ xuất hiện lại khi người dùng refresh hoặc chuyển trang qua lại.
     */
    if (location.state?.successMessage) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  /**
   * Cập nhật nhóm trường cơ bản của form tour.
   */
  function handleBaseChange(event) {
    const { name, value } = event.target;
    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  }

  /**
   * Cập nhật từng dòng lịch trình ngay trên state của form.
   */
  function handleItineraryChange(index, fieldName, value) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      itinerary: updateItemAtIndex(currentFormData.itinerary, index, (item) => ({ ...item, [fieldName]: value })),
    }));
  }

  /**
   * Cập nhật từng đợt khởi hành để quản lý ngày đi và số chỗ.
   */
  function handleDepartureChange(index, fieldName, value) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      departures: updateItemAtIndex(currentFormData.departures, index, (departure) => ({
        ...departure,
        [fieldName]: value,
      })),
    }));
  }

  /**
   * Thêm một ngày lịch trình mới ở cuối danh sách.
   */
  function handleAddItineraryItem() {
    setFormData((currentFormData) => ({
      ...currentFormData,
      itinerary: [...currentFormData.itinerary, createEmptyItineraryItem(currentFormData.itinerary.length + 1)],
    }));
  }

  /**
   * Thêm một lịch khởi hành mới ở cuối danh sách.
   */
  function handleAddDeparture() {
    setFormData((currentFormData) => ({
      ...currentFormData,
      departures: [...currentFormData.departures, createEmptyDepartureItem(currentFormData.departures.length + 1)],
    }));
  }

  /**
   * Xóa một dòng lịch trình nhưng luôn giữ ít nhất một dòng nhập liệu.
   */
  function handleRemoveItineraryItem(index) {
    setFormData((currentFormData) => {
      const nextItinerary = currentFormData.itinerary.filter((item, itemIndex) => itemIndex !== index);

      return {
        ...currentFormData,
        itinerary: nextItinerary.length
          ? nextItinerary.map((item, itemIndex) => ({ ...item, dayNumber: itemIndex + 1 }))
          : [createEmptyItineraryItem(1)],
      };
    });
  }

  /**
   * Xóa một đợt khởi hành nhưng luôn giữ ít nhất một khung nhập.
   */
  function handleRemoveDeparture(index) {
    setFormData((currentFormData) => {
      const nextDepartures = currentFormData.departures.filter((item, itemIndex) => itemIndex !== index);

      return {
        ...currentFormData,
        departures: nextDepartures.length ? nextDepartures : [createEmptyDepartureItem(1)],
      };
    });
  }

  /**
   * Lưu tour mới hoặc tour đã sửa vào backend.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = buildPayload(formData);

      if (isEditMode) {
        const updatedTour = await updateAdminTour(tourId, payload);
        setTourDetail(updatedTour);
        setFormData(createFormStateFromTour(updatedTour));
        setSuccessMessage('Đã lưu cập nhật cho tour này.');
      } else {
        const createdTour = await createAdminTour(payload);
        navigate(`/admin/tours/${createdTour.id}/edit`, {
          replace: true,
          state: { successMessage: 'Đã tạo tour mới thành công. Bạn có thể tiếp tục chỉnh sửa.' },
        });
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Xóa mềm hoặc khôi phục tour ngay tại form chỉnh sửa.
   */
  async function handleToggleDelete() {
    if (!tourDetail || !canDeleteTours) {
      return;
    }

    try {
      const updatedTour = await toggleAdminTourDeleteFlag(tourDetail.id);
      setTourDetail(updatedTour);
      setFormData(createFormStateFromTour(updatedTour));
      setSuccessMessage(updatedTour.deleteFlg ? 'Tour đã được đánh dấu xóa mềm.' : 'Tour đã được khôi phục.');
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  if (isLoading) {
    return <p className="helper-text">Đang tải thông tin tour...</p>;
  }

  if (errorMessage && isEditMode && !tourDetail) {
    return (
      <section className="content-card admin-empty-state">
        <h2>Không tìm thấy tour</h2>
        <p>{errorMessage}</p>
        <Link className="button button-primary" to="/admin/tours">
          Quay lại danh sách tour
        </Link>
      </section>
    );
  }

  const { remainingSeats, totalSeats } = calculateDepartureSummary(formData.departures);

  return (
    <div className="page-stack">
      <section className="content-card">
        <div className="section-heading-row admin-page-actions">
          <div>
            <p className="booking-id">{isEditMode ? `TOUR #${tourDetail?.id}` : 'TOUR-DRAFT'}</p>
            <h2>{isEditMode ? 'Chỉnh sửa tour' : 'Thêm tour mới'}</h2>
            <p className="helper-text">
              {isEditMode
                ? `Tour hiện tại đang ở trạng thái ${getAdminTourStatusLabel(formData.status).toLowerCase()}.`
                : 'Thiết lập thông tin cơ bản trước, sau đó cấu hình lịch trình và các kỳ khởi hành.'}
            </p>
          </div>

          <div className="admin-topbar-actions">
            <Link className="button button-secondary" to="/admin/tours">
              Về danh sách tour
            </Link>
            {isEditMode && canDeleteTours ? (
              <button
                className={tourDetail?.deleteFlg ? 'button button-success' : 'button button-danger'}
                type="button"
                onClick={handleToggleDelete}
              >
                {tourDetail?.deleteFlg ? 'Khôi phục tour' : 'Đánh dấu xóa mềm'}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
      {successMessage ? <p className="success-message">{successMessage}</p> : null}

      <div className="admin-detail-grid">
        <section className="content-card">
          <form className="form-card" onSubmit={handleSubmit}>
            <h2>Thông tin cơ bản</h2>

            <div className="admin-form-grid">
              <FormField label="Tên tour" name="title" onChange={handleBaseChange} value={formData.title} />
              <FormField label="Địa điểm" name="location" onChange={handleBaseChange} value={formData.location} />
              <FormField
                label="Điểm khởi hành"
                name="departurePoint"
                onChange={handleBaseChange}
                value={formData.departurePoint}
              />
              <FormField label="Nhóm tour" name="category" onChange={handleBaseChange} value={formData.category} />
              <FormField label="Giá tour" name="price" onChange={handleBaseChange} type="number" value={formData.price} />
              <FormField
                label="Số ngày đi"
                name="durationDays"
                onChange={handleBaseChange}
                type="number"
                value={formData.durationDays}
              />
              <FormField
                as="select"
                label="Trạng thái"
                name="status"
                onChange={handleBaseChange}
                options={adminMeta.editableTourStatusOptions}
                value={formData.status}
              />
              <FormField label="Ảnh đại diện" name="imageUrl" onChange={handleBaseChange} value={formData.imageUrl} />
            </div>

            <FormField
              as="textarea"
              label="Mô tả tour"
              name="description"
              onChange={handleBaseChange}
              placeholder="Mô tả ngắn gọn nội dung tour"
              value={formData.description}
            />

            <FormField
              as="textarea"
              label="Điểm nổi bật (mỗi dòng một ý)"
              name="highlightsText"
              onChange={handleBaseChange}
              placeholder="Ví dụ: Ngắm bình minh trên vịnh"
              value={formData.highlightsText}
            />

            <FormField
              as="textarea"
              label="Dịch vụ bao gồm (mỗi dòng một ý)"
              name="inclusionsText"
              onChange={handleBaseChange}
              placeholder="Ví dụ: Xe đưa đón, khách sạn, ăn sáng"
              value={formData.inclusionsText}
            />

            <div className="admin-form-actions">
              <button className="button button-primary" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Đang lưu...' : isEditMode ? 'Lưu cập nhật tour' : 'Tạo tour mới'}
              </button>
              <Link className="button button-secondary" to="/admin/tours">
                Hủy và quay lại
              </Link>
            </div>
          </form>
        </section>

        <section className="content-card">
          <h2>Tóm tắt nhanh</h2>
          <div className="admin-summary-grid">
            <article className="admin-mini-card">
              <span>Giá hiện tại</span>
              <strong>{formatCurrency(Number(formData.price) || 0)}</strong>
            </article>
            <article className="admin-mini-card">
              <span>Số lịch khởi hành</span>
              <strong>{formData.departures.length}</strong>
            </article>
            <article className="admin-mini-card">
              <span>Tổng số chỗ</span>
              <strong>{totalSeats}</strong>
            </article>
            <article className="admin-mini-card">
              <span>Số chỗ còn lại</span>
              <strong>{remainingSeats}</strong>
            </article>
          </div>

          <div className="admin-list-stack">
            <article className="admin-mini-card">
              <span>Điểm nổi bật</span>
              <strong>{formData.highlightsText ? formData.highlightsText.split('\n').filter(Boolean).length : 0} mục</strong>
            </article>
            <article className="admin-mini-card">
              <span>Lịch trình hiện tại</span>
              <strong>{formData.itinerary.length} ngày hiển thị trên form</strong>
            </article>
            <article className="admin-mini-card">
              <span>Trạng thái đang chọn</span>
              <strong>{getAdminTourStatusLabel(formData.status)}</strong>
            </article>
          </div>
        </section>
      </div>

      <section className="content-card">
        <div className="section-heading-row admin-page-actions">
          <div>
            <h2>Lịch trình tour</h2>
            <p className="helper-text">Chuẩn hóa nội dung từng ngày để lịch trình hiển thị nhất quán trên toàn hệ thống.</p>
          </div>
          <button className="button button-secondary" type="button" onClick={handleAddItineraryItem}>
            Thêm ngày mới
          </button>
        </div>

        <div className="admin-array-list">
          {formData.itinerary.map((item, index) => (
            <article className="admin-array-card" key={`${item.dayNumber}-${index}`}>
              <div className="admin-inline-grid">
                <FormField
                  label="Ngày"
                  name={`itinerary-day-${index}`}
                  onChange={(event) => handleItineraryChange(index, 'dayNumber', event.target.value)}
                  type="number"
                  value={item.dayNumber}
                />
                <FormField
                  label="Tiêu đề"
                  name={`itinerary-title-${index}`}
                  onChange={(event) => handleItineraryChange(index, 'title', event.target.value)}
                  value={item.title}
                />
              </div>

              <FormField
                as="textarea"
                label="Nội dung ngày đi"
                name={`itinerary-description-${index}`}
                onChange={(event) => handleItineraryChange(index, 'description', event.target.value)}
                placeholder="Ví dụ: Tham quan Bà Nà Hills, ăn tối buffet và nghỉ khách sạn"
                value={item.description}
              />

              <div className="admin-form-actions">
                <button className="button button-ghost" type="button" onClick={() => handleRemoveItineraryItem(index)}>
                  Xóa ngày này
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading-row admin-page-actions">
          <div>
            <h2>Lịch khởi hành và quỹ chỗ</h2>
            <p className="helper-text">Quản lý từng kỳ khởi hành, mức giá áp dụng và quỹ chỗ khả dụng để đồng bộ với vận hành thực tế.</p>
          </div>
          <button className="button button-secondary" type="button" onClick={handleAddDeparture}>
            Thêm lịch khởi hành
          </button>
        </div>

        <div className="admin-array-list">
          {formData.departures.map((departure, index) => (
            <article className="admin-array-card" key={`${departure.departureCode}-${index}`}>
              <div className="admin-form-grid">
                <FormField
                  label="Mã đợt"
                  name={`departure-code-${index}`}
                  onChange={(event) => handleDepartureChange(index, 'departureCode', event.target.value)}
                  value={departure.departureCode}
                />
                <FormField
                  label ="Nhãn hiển thị"
                  name={`departure-label-${index}`}
                  onChange={(event) => handleDepartureChange(index, 'labelText', event.target.value)}
                  value={departure.labelText}
                />
                <FormField
                  label="Ngày khởi hành"
                  name={`departure-date-${index}`}
                  onChange={(event) => handleDepartureChange(index, 'date', event.target.value)}
                  type="date"
                  value={departure.date}
                />
                <FormField
                  label="Giá áp dụng"
                  name={`departure-price-${index}`}
                  onChange={(event) => handleDepartureChange(index, 'price', event.target.value)}
                  type="number"
                  value={departure.price}
                />
                <FormField
                  label="Tổng số chỗ"
                  name={`departure-total-${index}`}
                  onChange={(event) => handleDepartureChange(index, 'seatsTotal', event.target.value)}
                  type="number"
                  value={departure.seatsTotal}
                />
                <FormField
                  label="Số chỗ còn lại"
                  name={`departure-remaining-${index}`}
                  onChange={(event) => handleDepartureChange(index, 'seatsRemaining', event.target.value)}
                  type="number"
                  value={departure.seatsRemaining}
                />
                <FormField
                  as="select"
                  label="Trạng thái"
                  name={`departure-status-${index}`}
                  onChange={(event) => handleDepartureChange(index, 'status', event.target.value)}
                  options={adminMeta.departureStatusOptions}
                  value={departure.status}
                />
              </div>

              <div className="admin-form-actions">
                <span className="chip">{getAdminDepartureStatusLabel(departure.status)}</span>
                <button className="button button-ghost" type="button" onClick={() => handleRemoveDeparture(index)}>
                  Xóa lịch này
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminTourFormPage;
