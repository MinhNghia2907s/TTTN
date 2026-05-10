import { withTransaction } from '../config/database.js';
import xlsx from 'xlsx';
import {
  createAdminTourRecord,
  findAdminBookingByCode,
  findAdminBookingByRecordId,
  findAdminBookings,
  findAdminPaymentByCode,
  findAdminPaymentByRecordId,
  findAdminPayments,
  findAdminTourById,
  findAdminTours,
  findAdminUserById,
  findAdminUsers,
  replaceAdminTourDepartures,
  replaceAdminTourItineraries,
  softDeleteAdminTourById,
  updateAdminBookingByRecordId,
  updateAdminPaymentByRecordId,
  updateAdminTourRecord,
  updateAdminUserById,
} from '../models/adminModel.js';
import { findUserByEmail, findUserByPhone } from '../models/userModel.js';
import { releaseDepartureSlots } from '../models/tourModel.js';
import * as PromotionModel from '../models/promotionModel.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Nhóm hằng số dùng cho admin:
 * - validate payload gửi từ frontend
 * - dựng option cho select ở giao diện admin
 * - map trạng thái nội bộ sang nhãn hiển thị tiếng Việt
 */
const USER_ROLES = ['user', 'admin', 'staff'];
const USER_STATUSES = ['active', 'inactive', 'blocked'];
const TOUR_STATUSES = ['draft', 'published', 'archived'];
const BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
const PAYMENT_STATUSES = ['waiting', 'paid', 'refunded', 'failed'];
const DEPARTURE_STATUSES = ['open', 'nearly_full', 'closed', 'completed'];
const PAYMENT_METHODS = ['payos', 'card', 'bank_transfer', 'ewallet', 'cash'];
const TOUR_IMPORT_SHEET_NAME = 'Tours';
const TOUR_IMPORT_DEPARTURES_SHEET_NAME = 'Departures';
const TOUR_IMPORT_ITINERARY_SHEET_NAME = 'Itineraries';
const TOUR_IMPORT_COLUMNS = {
  category: ['Nhóm tour', 'Loại tour', 'Danh mục tour', 'category'],
  departureCode: ['Mã lịch khởi hành', 'Mã khởi hành', 'Mã lịch', 'departureCode'],
  departureDate: ['Ngày khởi hành', 'Ngày đi', 'departureDate'],
  departurePoint: ['Điểm khởi hành', 'Điểm xuất phát', 'Nơi khởi hành', 'departurePoint'],
  description: ['Mô tả', 'Mô tả tour', 'Nội dung mô tả', 'description'],
  durationDays: ['Số ngày', 'Số ngày tour', 'Thời lượng ngày', 'durationDays'],
  highlights: ['Điểm nổi bật', 'Điểm nhấn', 'highlights'],
  imageUrl: ['Ảnh tour', 'Hình ảnh', 'Link ảnh', 'imageUrl'],
  inclusions: ['Dịch vụ bao gồm', 'Bao gồm', 'inclusions'],
  itineraryDayNumber: ['Ngày thứ', 'Ngày', 'Thứ tự ngày', 'dayNumber'],
  itineraryTitle: ['Tiêu đề', 'Tiêu đề lịch trình', 'Tên lịch trình', 'title'],
  labelText: ['Nhãn hiển thị', 'Tên lịch khởi hành', 'labelText'],
  location: ['Địa điểm', 'Điểm đến', 'Địa điểm tour', 'location'],
  price: ['Giá', 'Giá tour', 'Đơn giá', 'price'],
  seatsRemaining: ['Số chỗ còn lại', 'Chỗ còn lại', 'seatsRemaining'],
  seatsTotal: ['Tổng số chỗ', 'Số chỗ', 'Số lượng chỗ', 'seatsTotal'],
  status: ['Trạng thái', 'Tình trạng', 'status'],
  title: ['Tên tour', 'Tên gói tour', 'Tên chương trình', 'title'],
  tourCode: ['Mã tour', 'Mã gói tour', 'Mã chương trình', 'tourCode'],
};

const ROLE_LABELS = {
  admin: 'Quản trị viên',
  staff: 'Nhân viên',
  user: 'Người dùng',
};

const USER_STATUS_LABELS = {
  active: 'Đang hoạt động',
  blocked: 'Bị khóa',
  inactive: 'Tạm ngưng',
};

const TOUR_STATUS_LABELS = {
  archived: 'Tạm ẩn',
  draft: 'Bản nháp',
  published: 'Đang mở bán',
};

const BOOKING_STATUS_LABELS = {
  cancelled: 'Đã hủy',
  completed: 'Đã hoàn tất',
  confirmed: 'Đã xác nhận',
  pending: 'Chờ xác nhận',
};

const PAYMENT_STATUS_LABELS = {
  failed: 'Thất bại',
  paid: 'Đã thanh toán',
  refunded: 'Đã hoàn tiền',
  waiting: 'Chờ thanh toán',
};

const PAYMENT_METHOD_LABELS = {
  payos: 'PayOS',
  bank_transfer: 'Chuyển khoản',
  card: 'Thẻ nội địa / quốc tế',
  cash: 'Tiền mặt',
  ewallet: 'Ví điện tử',
};

const DEPARTURE_STATUS_LABELS = {
  closed: 'Đã khóa',
  completed: 'Đã khởi hành',
  nearly_full: 'Sắp đầy',
  open: 'Đang nhận khách',
};

/**
 * Biến danh sách enum nội bộ thành option `{ value, label }` cho frontend.
 * Nếu truyền `allLabel`, hàm sẽ tự chèn thêm lựa chọn "all" ở đầu mảng.
 */
function buildOptionList(values, labels, allLabel = null) {
  const options = values.map((value) => ({
    label: labels[value] || value,
    value,
  }));

  if (!allLabel) {
    return options;
  }

  return [{ label: allLabel, value: 'all' }, ...options];
}

/**
 * Tạo mốc thời gian ngắn gọn tới mức phút để đưa vào timeline vận hành.
 */
function createTimestamp() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

/**
 * Tạo chuỗi DATETIME theo định dạng SQL để ghi vào các cột thời gian trong database.
 */
function createSqlDateTime() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Nối thêm một mốc xử lý mới vào cuối timeline hiện tại.
 */
function appendTimelineItem(timeline, title, detail) {
  return [
    ...(Array.isArray(timeline) ? timeline : []),
    {
      detail,
      time: createTimestamp(),
      title,
    },
  ];
}

/**
 * Sinh nhãn số ngày và số đêm từ durationDays để lưu đồng bộ với bảng tours.
 */
function buildDurationLabel(durationDays) {
  const nights = Math.max(Number(durationDays) - 1, 0);
  return `${durationDays} ngày ${nights} đêm`;
}

/**
 * Chuẩn hóa tiêu đề tour thành slug chỉ gồm chữ thường, số và dấu gạch ngang.
 */
function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Tạo slug cho tour mới hoặc tour đang sửa để tránh đụng định dạng URL trong DB.
 */
function buildTourSlug(title, currentTourId = null) {
  const slugBase = slugify(title) || 'tour';
  return currentTourId ? `${slugBase}-${currentTourId}` : `${slugBase}-${Date.now().toString().slice(-6)}`;
}

/**
 * Chuẩn hóa danh sách text từ mảng hoặc textarea nhiều dòng sang mảng sạch để lưu JSON.
 */
function normalizeTextArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  return String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Suy ra trạng thái departure từ số chỗ còn lại nếu payload chưa truyền trạng thái rõ ràng.
 */
function getDerivedDepartureStatus(seatsTotal, seatsRemaining, preferredStatus) {
  if (DEPARTURE_STATUSES.includes(preferredStatus)) {
    return preferredStatus;
  }

  if (seatsRemaining <= 0) {
    return 'closed';
  }

  if (seatsRemaining <= Math.max(Math.ceil(seatsTotal * 0.2), 3)) {
    return 'nearly_full';
  }

  return 'open';
}

/**
 * Chuẩn hóa itinerary để mỗi dòng có dayNumber, title và description rõ ràng.
 */
function normalizeItineraryList(itinerary) {
  if (!Array.isArray(itinerary)) {
    return [];
  }

  return itinerary
    .map((item, index) => ({
      dayNumber: Number(item.dayNumber ?? item.day ?? index + 1) || index + 1,
      description: String(item.description || '').trim(),
      title: String(item.title || '').trim(),
    }))
    .filter((item) => item.title || item.description);
}

/**
 * Chuẩn hóa danh sách lịch khởi hành trước khi ghi DB.
 * Dữ liệu từ form có thể đang ở dạng string, tên field khác nhau hoặc thiếu mã đợt,
 * nên hàm này gom toàn bộ về một shape ổn định để model chỉ việc insert/update.
 */
function normalizeDepartureList(tourId, departures, fallbackPrice) {
  if (!Array.isArray(departures)) {
    return [];
  }

  return departures
    .map((departure, index) => {
      const seatsTotal = Math.max(Number(departure.seatsTotal ?? departure.slotsTotal ?? 0), 0);
      const seatsRemaining = Math.min(
        Math.max(Number(departure.seatsRemaining ?? departure.slotsRemaining ?? seatsTotal), 0),
        seatsTotal,
      );
      const price = Math.max(Number(departure.price ?? fallbackPrice ?? 0), 0);
      const departureDate = String(departure.departureDate ?? departure.date ?? '').trim();

      return {
        departureCode:
          String(departure.departureCode || '').trim() ||
          `DEP-${tourId}-${index + 1}-${Date.now().toString().slice(-4)}`,
        departureDate,
        labelText:
          String(departure.labelText || '').trim() ||
          `Khởi hành ${departureDate || `đợt ${index + 1}`}`,
        price,
        seatsBooked: Math.max(seatsTotal - seatsRemaining, 0),
        seatsRemaining,
        seatsTotal,
        status: getDerivedDepartureStatus(seatsTotal, seatsRemaining, departure.status),
      };
    })
    .filter((departure) => departure.departureDate);
}

/**
 * Đọc một sheet Excel thành mảng object. `defval: ''` giúp ô trống vẫn có key,
 * nhờ vậy thông báo lỗi import sẽ dễ hiểu hơn cho admin.
 */
function readExcelSheet(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    return [];
  }

  return xlsx.utils.sheet_to_json(sheet, {
    defval: '',
    raw: true,
  });
}

function normalizeExcelKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
}

function getExcelValue(row, fieldNames) {
  const candidates = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
  const normalizedRow = Object.fromEntries(
    Object.entries(row || {}).map(([key, value]) => [normalizeExcelKey(key), value]),
  );

  for (const fieldName of candidates) {
    if (row?.[fieldName] !== undefined) {
      return row[fieldName];
    }

    const normalizedFieldName = normalizeExcelKey(fieldName);

    if (normalizedRow[normalizedFieldName] !== undefined) {
      return normalizedRow[normalizedFieldName];
    }
  }

  return '';
}

function normalizeImportText(value) {
  return String(value ?? '').trim();
}

function normalizeImportNumber(value, fallback = 0) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function normalizeImportStatus(value, allowedStatuses, fallback) {
  const status = normalizeImportText(value) || fallback;
  return allowedStatuses.includes(status) ? status : fallback;
}

function splitImportList(value) {
  return normalizeImportText(value)
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Excel có thể trả ngày dạng Date, serial number hoặc chuỗi yyyy-mm-dd.
 * Hàm này gom các kiểu đó về format DATE mà MySQL đang dùng.
 */
function normalizeImportDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'number') {
    const parsedDate = xlsx.SSF.parse_date_code(value);

    if (parsedDate) {
      const month = String(parsedDate.m).padStart(2, '0');
      const day = String(parsedDate.d).padStart(2, '0');
      return `${parsedDate.y}-${month}-${day}`;
    }
  }

  const textValue = normalizeImportText(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(textValue)) {
    return textValue;
  }

  const date = new Date(textValue);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function requireImportValue(value, fieldName, rowIndex, sheetName) {
  const normalized = normalizeImportText(value);

  if (!normalized) {
    throw new ApiError(400, `Sheet ${sheetName}, dòng ${rowIndex}: thiếu ${fieldName}.`);
  }

  return normalized;
}

/**
 * Chuyển workbook Excel sang danh sách payload tour giống form admin.
 * Mẫu dùng tourCode để liên kết 3 sheet: Tours, Departures và Itineraries.
 */
function parseTourImportWorkbook(fileBuffer) {
  const workbook = xlsx.read(fileBuffer, {
    cellDates: true,
    type: 'buffer',
  });
  const tourRows = readExcelSheet(workbook, TOUR_IMPORT_SHEET_NAME);
  const departureRows = readExcelSheet(workbook, TOUR_IMPORT_DEPARTURES_SHEET_NAME);
  const itineraryRows = readExcelSheet(workbook, TOUR_IMPORT_ITINERARY_SHEET_NAME);

  if (!tourRows.length) {
    throw new ApiError(400, `File Excel cần có sheet ${TOUR_IMPORT_SHEET_NAME} và ít nhất một tour.`);
  }

  return tourRows.map((row, index) => {
    const rowNumber = index + 2;
    const tourCode = requireImportValue(getExcelValue(row, TOUR_IMPORT_COLUMNS.tourCode), 'Mã tour', rowNumber, TOUR_IMPORT_SHEET_NAME);
    const title = requireImportValue(getExcelValue(row, TOUR_IMPORT_COLUMNS.title), 'Tên tour', rowNumber, TOUR_IMPORT_SHEET_NAME);
    const location = requireImportValue(getExcelValue(row, TOUR_IMPORT_COLUMNS.location), 'Địa điểm', rowNumber, TOUR_IMPORT_SHEET_NAME);
    const departurePoint = requireImportValue(
      getExcelValue(row, TOUR_IMPORT_COLUMNS.departurePoint),
      'Điểm khởi hành',
      rowNumber,
      TOUR_IMPORT_SHEET_NAME,
    );
    const category = requireImportValue(getExcelValue(row, TOUR_IMPORT_COLUMNS.category), 'Nhóm tour', rowNumber, TOUR_IMPORT_SHEET_NAME);
    const description = requireImportValue(
      getExcelValue(row, TOUR_IMPORT_COLUMNS.description),
      'Mô tả',
      rowNumber,
      TOUR_IMPORT_SHEET_NAME,
    );
    const durationDays = normalizeImportNumber(getExcelValue(row, TOUR_IMPORT_COLUMNS.durationDays));
    const price = normalizeImportNumber(getExcelValue(row, TOUR_IMPORT_COLUMNS.price));

    if (!Number.isInteger(durationDays) || durationDays < 1) {
      throw new ApiError(400, `Sheet ${TOUR_IMPORT_SHEET_NAME}, dòng ${rowNumber}: Số ngày phải là số nguyên lớn hơn 0.`);
    }

    if (price <= 0) {
      throw new ApiError(400, `Sheet ${TOUR_IMPORT_SHEET_NAME}, dòng ${rowNumber}: Giá phải lớn hơn 0.`);
    }

    const tourDepartures = departureRows
      .filter((departureRow) => normalizeImportText(getExcelValue(departureRow, TOUR_IMPORT_COLUMNS.tourCode)) === tourCode)
      .map((departureRow, departureIndex) => {
        const departureRowNumber = departureIndex + 2;
        const departureDate = normalizeImportDate(getExcelValue(departureRow, TOUR_IMPORT_COLUMNS.departureDate));
        const seatsTotal = normalizeImportNumber(getExcelValue(departureRow, TOUR_IMPORT_COLUMNS.seatsTotal));
        const seatsRemaining = normalizeImportNumber(getExcelValue(departureRow, TOUR_IMPORT_COLUMNS.seatsRemaining), seatsTotal);

        if (!departureDate) {
          throw new ApiError(400, `Sheet ${TOUR_IMPORT_DEPARTURES_SHEET_NAME}, dòng ${departureRowNumber}: Ngày khởi hành không hợp lệ.`);
        }

        if (seatsTotal < 1) {
          throw new ApiError(400, `Sheet ${TOUR_IMPORT_DEPARTURES_SHEET_NAME}, dòng ${departureRowNumber}: Tổng số chỗ phải lớn hơn 0.`);
        }

        return {
          date: departureDate,
          departureCode: normalizeImportText(getExcelValue(departureRow, TOUR_IMPORT_COLUMNS.departureCode)),
          labelText: normalizeImportText(getExcelValue(departureRow, TOUR_IMPORT_COLUMNS.labelText)),
          price: normalizeImportNumber(getExcelValue(departureRow, TOUR_IMPORT_COLUMNS.price), price),
          seatsRemaining,
          seatsTotal,
          status: normalizeImportStatus(getExcelValue(departureRow, TOUR_IMPORT_COLUMNS.status), DEPARTURE_STATUSES, 'open'),
        };
      });

    if (!tourDepartures.length) {
      throw new ApiError(400, `Tour ${tourCode} cần ít nhất một dòng trong sheet ${TOUR_IMPORT_DEPARTURES_SHEET_NAME}.`);
    }

    const tourItinerary = itineraryRows
      .filter((itineraryRow) => normalizeImportText(getExcelValue(itineraryRow, TOUR_IMPORT_COLUMNS.tourCode)) === tourCode)
      .map((itineraryRow, itineraryIndex) => ({
        dayNumber: normalizeImportNumber(getExcelValue(itineraryRow, TOUR_IMPORT_COLUMNS.itineraryDayNumber), itineraryIndex + 1),
        description: normalizeImportText(getExcelValue(itineraryRow, TOUR_IMPORT_COLUMNS.description)),
        title: normalizeImportText(getExcelValue(itineraryRow, TOUR_IMPORT_COLUMNS.itineraryTitle)),
      }));

    return {
      category,
      departurePoint,
      departures: tourDepartures,
      description,
      durationDays,
      highlights: splitImportList(getExcelValue(row, TOUR_IMPORT_COLUMNS.highlights)),
      imageUrl: normalizeImportText(getExcelValue(row, TOUR_IMPORT_COLUMNS.imageUrl)),
      inclusions: splitImportList(getExcelValue(row, TOUR_IMPORT_COLUMNS.inclusions)),
      itinerary: tourItinerary,
      location,
      price,
      status: normalizeImportStatus(getExcelValue(row, TOUR_IMPORT_COLUMNS.status), TOUR_STATUSES, 'draft'),
      title,
      tourCode,
    };
  });
}

/**
 * Chuẩn hóa payload tour từ frontend admin trước khi ghi xuống database.
 */
function normalizeTourPayload(payload, currentTourId = null) {
  const title = String(payload?.title || '').trim();
  const location = String(payload?.location || '').trim();
  const departurePoint = String(payload?.departurePoint || '').trim();
  const category = String(payload?.category || '').trim();
  const description = String(payload?.description || '').trim();
  const durationDays = Number(payload?.durationDays);
  const price = Math.max(Number(payload?.price), 0);
  const status = String(payload?.status || 'draft').trim();

  if (!title || !location || !departurePoint || !category || !description) {
    throw new ApiError(400, 'Vui lòng cung cấp đủ tên tour, địa điểm, điểm khởi hành, nhóm tour và mô tả.');
  }

  if (!Number.isInteger(durationDays) || durationDays < 1) {
    throw new ApiError(400, 'Số ngày tour cần là số nguyên lớn hơn 0.');
  }

  if (!TOUR_STATUSES.includes(status)) {
    throw new ApiError(400, 'Trạng thái tour không hợp lệ.');
  }

  return {
    category,
    deleteFlg: Boolean(payload?.deleteFlg),
    departurePoint,
    description,
    durationDays,
    durationLabel: buildDurationLabel(durationDays),
    highlights: normalizeTextArray(payload?.highlights),
    imageUrl:
      String(payload?.imageUrl || '').trim() ||
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    inclusions: normalizeTextArray(payload?.inclusions),
    location,
    price,
    slug: buildTourSlug(title, currentTourId),
    status,
    title,
  };
}

/**
 * Đổi lỗi unique key của MySQL thành thông báo dễ hiểu hơn cho phía admin.
 */
function mapDuplicateWriteError(error) {
  if (error?.code !== 'ER_DUP_ENTRY') {
    throw error;
  }

  const message = String(error.sqlMessage || error.message || '');

  if (message.includes('uq_users_email')) {
    throw new ApiError(409, 'Email này đã được sử dụng.');
  }

  if (message.includes('uq_users_phone')) {
    throw new ApiError(409, 'Số điện thoại này đã được sử dụng.');
  }

  if (message.includes('uq_tours_slug')) {
    throw new ApiError(409, 'Slug của tour đang bị trùng. Vui lòng đổi tên tour và thử lại.');
  }

  if (message.includes('uq_departure_code')) {
    throw new ApiError(409, 'Mã lịch khởi hành đang bị trùng. Vui lòng thử lại.');
  }

  throw error;
}

/**
 * Trả metadata cho trang admin:
 * - option tĩnh: vai trò, trạng thái, phương thức thanh toán...
 * - option động: category tour đang tồn tại trong DB
 *
 * Mục tiêu là để frontend không phải hard-code enum nghiệp vụ.
 */
export async function getAdminMeta() {
  const tours = await findAdminTours();
  const categoryOptions = [
    { label: 'Tất cả nhóm tour', value: 'all' },
    ...[...new Set(tours.map((tour) => tour.category).filter(Boolean))]
      .sort()
      .map((category) => ({
        label: category,
        value: category,
      })),
  ];

  return {
    bookingStatusOptions: buildOptionList(BOOKING_STATUSES, BOOKING_STATUS_LABELS, 'Tất cả trạng thái booking'),
    categoryOptions,
    departureStatusOptions: buildOptionList(DEPARTURE_STATUSES, DEPARTURE_STATUS_LABELS),
    editableBookingStatusOptions: buildOptionList(BOOKING_STATUSES, BOOKING_STATUS_LABELS),
    editableTourStatusOptions: buildOptionList(TOUR_STATUSES, TOUR_STATUS_LABELS),
    editableUserRoleOptions: buildOptionList(USER_ROLES, ROLE_LABELS),
    editableUserStatusOptions: buildOptionList(USER_STATUSES, USER_STATUS_LABELS),
    paymentMethodOptions: buildOptionList(PAYMENT_METHODS, PAYMENT_METHOD_LABELS, 'Tất cả phương thức'),
    paymentStatusOptions: buildOptionList(PAYMENT_STATUSES, PAYMENT_STATUS_LABELS, 'Tất cả trạng thái thanh toán'),
    tourStatusOptions: buildOptionList(TOUR_STATUSES, TOUR_STATUS_LABELS, 'Tất cả trạng thái tour'),
    userRoleOptions: buildOptionList(USER_ROLES, ROLE_LABELS, 'Tất cả vai trò'),
    userStatusOptions: buildOptionList(USER_STATUSES, USER_STATUS_LABELS, 'Tất cả trạng thái'),
  };
}

export async function getAdminUserList() {
  return findAdminUsers();
}

/**
 * Lấy chi tiết một user theo id.
 */
export async function getAdminUserDetail(userId) {
  const user = await findAdminUserById(userId);

  if (!user) {
    throw new ApiError(404, 'Không tìm thấy người dùng.');
  }

  return user;
}

/**
 * Cập nhật user từ khu vực admin, đồng thời chặn việc tự khóa chính tài khoản đang thao tác.
 */
export async function editAdminUser(currentAdminId, userId, payload) {
  const targetUser = await findAdminUserById(userId);

  if (!targetUser) {
    throw new ApiError(404, 'Không tìm thấy người dùng cần cập nhật.');
  }

  const nextRole = payload.role !== undefined ? String(payload.role).trim() : targetUser.role;
  const nextStatus = payload.status !== undefined ? String(payload.status).trim() : targetUser.status;
  const nextDeleteFlg = payload.deleteFlg !== undefined ? Boolean(payload.deleteFlg) : targetUser.deleteFlg;

  if (!USER_ROLES.includes(nextRole)) {
    throw new ApiError(400, 'Vai trò người dùng không hợp lệ.');
  }

  if (!USER_STATUSES.includes(nextStatus)) {
    throw new ApiError(400, 'Trạng thái người dùng không hợp lệ.');
  }

  if (Number(currentAdminId) === Number(userId) && (nextRole === 'user' || nextStatus !== 'active' || nextDeleteFlg)) {
    throw new ApiError(400, 'Bạn không thể tự hạ quyền, tự khóa hoặc tự xóa mềm tài khoản đang đăng nhập.');
  }

  const email = payload.email !== undefined ? String(payload.email).trim().toLowerCase() : targetUser.email;
  const phone = payload.phone !== undefined ? String(payload.phone).trim() : targetUser.phone;
  const fullName = payload.fullName !== undefined ? String(payload.fullName).trim() : targetUser.fullName;

  if (!fullName || !email || !phone) {
    throw new ApiError(400, 'Họ tên, email và số điện thoại không được để trống.');
  }

  const emailOwner = await findUserByEmail(email);
  if (emailOwner && emailOwner.id !== Number(userId)) {
    throw new ApiError(409, 'Email này đã được sử dụng.');
  }

  const phoneOwner = await findUserByPhone(phone);
  if (phoneOwner && phoneOwner.id !== Number(userId)) {
    throw new ApiError(409, 'Số điện thoại này đã được sử dụng.');
  }

  try {
    return await updateAdminUserById(userId, {
      deleteFlg: nextDeleteFlg,
      email,
      fullName,
      phone,
      role: nextRole,
      status: nextDeleteFlg ? 'inactive' : nextStatus,
    });
  } catch (error) {
    mapDuplicateWriteError(error);
  }
}

/**
 * Xóa mềm user bằng cách bật delete_flg và chuyển trạng thái sang inactive.
 */
export async function deleteAdminUser(currentAdminId, userId) {
  if (Number(currentAdminId) === Number(userId)) {
    throw new ApiError(400, 'Bạn không thể tự xóa mềm tài khoản đang đăng nhập.');
  }

  const user = await findAdminUserById(userId);

  if (!user) {
    throw new ApiError(404, 'Không tìm thấy người dùng.');
  }

  return updateAdminUserById(userId, {
    deleteFlg: true,
    status: 'inactive',
  });
}

/**
 * Lấy danh sách tour cho admin.
 */
export async function getAdminTourList() {
  return findAdminTours();
}

/**
 * Lấy chi tiết một tour cho form chỉnh sửa.
 */
export async function getAdminTourDetail(tourId) {
  const tour = await findAdminTourById(tourId);

  if (!tour) {
    throw new ApiError(404, 'Không tìm thấy tour.');
  }

  return tour;
}

/**
 * Tạo tour mới cùng itinerary và departures trong cùng một transaction.
 */
export async function createTourByAdmin(payload) {
  const normalizedTour = normalizeTourPayload(payload);
  const itineraryList = normalizeItineraryList(payload?.itinerary);

  try {
    return await withTransaction(async (connection) => {
      const tourId = await createAdminTourRecord(normalizedTour, connection);
      const departureList = normalizeDepartureList(tourId, payload?.departures, normalizedTour.price);

      await replaceAdminTourItineraries(tourId, itineraryList, connection);
      await replaceAdminTourDepartures(tourId, departureList, connection);

      return findAdminTourById(tourId, connection);
    });
  } catch (error) {
    mapDuplicateWriteError(error);
  }
}

/**
 * Cập nhật tour hiện có và ghi lại toàn bộ itinerary, departures mới.
 */
export async function updateTourByAdmin(tourId, payload) {
  const currentTour = await findAdminTourById(tourId);

  if (!currentTour) {
    throw new ApiError(404, 'Không tìm thấy tour.');
  }

  const normalizedTour = normalizeTourPayload(payload, currentTour.id);
  const itineraryList = normalizeItineraryList(payload?.itinerary);
  const departureList = normalizeDepartureList(currentTour.id, payload?.departures, normalizedTour.price);

  try {
    return await withTransaction(async (connection) => {
      await updateAdminTourRecord(tourId, normalizedTour, connection);
      await replaceAdminTourItineraries(tourId, itineraryList, connection);
      await replaceAdminTourDepartures(tourId, departureList, connection);

      return findAdminTourById(tourId, connection);
    });
  } catch (error) {
    mapDuplicateWriteError(error);
  }
}

/**
 * Xóa mềm tour từ khu vực admin.
 */
export async function deleteTourByAdmin(tourId) {
  const tour = await findAdminTourById(tourId);

  if (!tour) {
    throw new ApiError(404, 'Không tìm thấy tour.');
  }

  return softDeleteAdminTourById(tourId);
}

/**
 * Tạo file Excel mẫu ngay trên backend để frontend luôn tải được đúng format mới nhất.
 */
export function createTourImportTemplateBuffer() {
  const workbook = xlsx.utils.book_new();
  const tourSheet = xlsx.utils.aoa_to_sheet([
    [
      'Mã tour',
      'Tên tour',
      'Địa điểm',
      'Điểm khởi hành',
      'Nhóm tour',
      'Số ngày',
      'Giá',
      'Ảnh tour',
      'Mô tả',
      'Điểm nổi bật',
      'Dịch vụ bao gồm',
      'Trạng thái',
    ],
    [
      'TOUR001',
      'Khám phá Đà Lạt 3 ngày',
      'Đà Lạt',
      'TP. Hồ Chí Minh',
      'Nghỉ dưỡng',
      3,
      3200000,
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
      'Tour nghỉ dưỡng, tham quan các điểm nổi bật tại Đà Lạt.',
      'Thung lũng Tình Yêu; Hồ Tuyền Lâm; Chợ đêm Đà Lạt',
      'Xe đưa đón; Khách sạn; Vé tham quan; Hướng dẫn viên',
      'published',
    ],
  ]);
  const departureSheet = xlsx.utils.aoa_to_sheet([
    ['Mã tour', 'Ngày khởi hành', 'Mã lịch khởi hành', 'Tổng số chỗ', 'Số chỗ còn lại', 'Giá', 'Nhãn hiển thị', 'Trạng thái'],
    ['TOUR001', '2026-06-15', 'DL-20260615', 30, 30, 3200000, 'Khởi hành giữa tháng 6', 'open'],
    ['TOUR001', '2026-07-01', 'DL-20260701', 25, 25, 3400000, 'Lịch hè tháng 7', 'open'],
  ]);
  const itinerarySheet = xlsx.utils.aoa_to_sheet([
    ['Mã tour', 'Ngày thứ', 'Tiêu đề', 'Mô tả'],
    ['TOUR001', 1, 'Di chuyển đến Đà Lạt', 'Đón khách, tham quan quảng trường Lâm Viên và nhận phòng khách sạn.'],
    ['TOUR001', 2, 'Khám phá thành phố', 'Tham quan Hồ Tuyền Lâm, Thiền viện Trúc Lâm và chợ đêm Đà Lạt.'],
    ['TOUR001', 3, 'Mua sắm và trở về', 'Tự do mua đặc sản, trả phòng và khởi hành về điểm đón ban đầu.'],
  ]);
  const noteSheet = xlsx.utils.aoa_to_sheet([
    ['Cột', 'Ý nghĩa'],
    ['Mã tour', 'Mã tạm trong file Excel, dùng để liên kết tour với Departures và Itineraries.'],
    ['Trạng thái', 'Tour: draft/published/archived. Departure: open/nearly_full/closed/completed.'],
    ['Điểm nổi bật, Dịch vụ bao gồm', 'Nhập nhiều ý bằng dấu chấm phẩy ;'],
    ['Ngày khởi hành', 'Định dạng yyyy-mm-dd, ví dụ 2026-06-15.'],
  ]);

  tourSheet['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 70 }, { wch: 55 }, { wch: 45 }, { wch: 45 }, { wch: 14 }];
  departureSheet['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 32 }, { wch: 14 }];
  itinerarySheet['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 30 }, { wch: 70 }];
  noteSheet['!cols'] = [{ wch: 24 }, { wch: 90 }];

  xlsx.utils.book_append_sheet(workbook, tourSheet, TOUR_IMPORT_SHEET_NAME);
  xlsx.utils.book_append_sheet(workbook, departureSheet, TOUR_IMPORT_DEPARTURES_SHEET_NAME);
  xlsx.utils.book_append_sheet(workbook, itinerarySheet, TOUR_IMPORT_ITINERARY_SHEET_NAME);
  xlsx.utils.book_append_sheet(workbook, noteSheet, 'Notes');

  return xlsx.write(workbook, {
    bookType: 'xlsx',
    type: 'buffer',
  });
}

/**
 * Import nhiều tour từ Excel. Toàn bộ file được xử lý trong một transaction:
 * nếu một dòng lỗi thì rollback, tránh tình trạng import nửa chừng.
 */
export async function importToursByAdmin(fileBuffer) {
  const tourPayloads = parseTourImportWorkbook(fileBuffer);

  try {
    return await withTransaction(async (connection) => {
      const importedTours = [];

      for (const tourPayload of tourPayloads) {
        const normalizedTour = normalizeTourPayload(tourPayload);
        const tourId = await createAdminTourRecord(normalizedTour, connection);
        const departureList = normalizeDepartureList(tourId, tourPayload.departures, normalizedTour.price);
        const itineraryList = normalizeItineraryList(tourPayload.itinerary);

        await replaceAdminTourItineraries(tourId, itineraryList, connection);
        await replaceAdminTourDepartures(tourId, departureList, connection);

        importedTours.push(await findAdminTourById(tourId, connection));
      }

      return {
        importedCount: importedTours.length,
        tours: importedTours,
      };
    });
  } catch (error) {
    mapDuplicateWriteError(error);
  }
}

/**
 * Lấy danh sách booking cho admin.
 */
export async function getAdminBookingList() {
  return findAdminBookings();
}

/**
 * Lấy chi tiết một booking theo booking_code.
 */
export async function getAdminBookingDetail(bookingCode) {
  const booking = await findAdminBookingByCode(bookingCode);

  if (!booking) {
    throw new ApiError(404, 'Không tìm thấy booking.');
  }

  return booking;
}

/**
 * Cập nhật trạng thái booking từ khu vực admin và trả slot nếu booking bị hủy.
 */
export async function updateBookingStatusByAdmin(bookingCode, payload) {
  const nextStatus = String(payload?.status || '').trim();

  if (!BOOKING_STATUSES.includes(nextStatus)) {
    throw new ApiError(400, 'Trạng thái booking không hợp lệ.');
  }

  return withTransaction(async (connection) => {
    const booking = await findAdminBookingByCode(bookingCode, { includeInternal: true }, connection);

    if (!booking) {
      throw new ApiError(404, 'Không tìm thấy booking.');
    }

    if (booking.status === 'completed' && nextStatus !== 'completed') {
      throw new ApiError(400, 'Booking đã hoàn tất nên không thể chuyển lại trạng thái khác.');
    }

    if (booking.status === 'cancelled' && nextStatus !== 'cancelled') {
      throw new ApiError(400, 'Booking đã hủy nên không hỗ trợ mở lại qua API admin hiện tại.');
    }

    /**
     * Timeline được lưu như một mảng mốc xử lý của booking.
     * Mỗi lần admin thao tác, ta nối thêm một item mới để giao diện detail
     * hiển thị được lịch sử vận hành rõ ràng.
     */
    const timeline = appendTimelineItem(
      booking.timeline,
      'Admin cập nhật trạng thái booking',
      `Trạng thái booking được chuyển sang ${nextStatus}.`,
    );

    /**
     * Khi booking bị hủy từ trạng thái còn giữ chỗ, cần hoàn lại slot về departure.
     * Nếu booking đã completed hoặc đã cancelled trước đó thì không release nữa
     * để tránh cộng chồng sai số chỗ.
     */
    if (nextStatus === 'cancelled' && booking.status !== 'cancelled' && booking.status !== 'completed') {
      await releaseDepartureSlots(booking.tourId, booking.departureId, booking.travelers, connection);
    }

    return updateAdminBookingByRecordId(
      booking._bookingDbId,
      {
        status: nextStatus,
        timeline,
      },
      connection,
    );
  });
}

/**
 * Xóa mềm booking từ khu vực admin, đồng thời giải phóng slot nếu booking còn giữ chỗ.
 */
export async function deleteBookingByAdmin(bookingCode) {
  return withTransaction(async (connection) => {
    const booking = await findAdminBookingByCode(bookingCode, { includeInternal: true }, connection);

    if (!booking) {
      throw new ApiError(404, 'Không tìm thấy booking.');
    }

    if (!booking.deleteFlg && booking.status !== 'cancelled' && booking.status !== 'completed') {
      await releaseDepartureSlots(booking.tourId, booking.departureId, booking.travelers, connection);
    }

    // Xóa mềm vẫn giữ lại lịch sử, chỉ ẩn booking khỏi luồng vận hành chính.
    const timeline = appendTimelineItem(
      booking.timeline,
      'Booking bị xóa mềm',
      'Admin đã đánh dấu xóa mềm booking khỏi danh sách vận hành.',
    );

    return updateAdminBookingByRecordId(
      booking._bookingDbId,
      {
        deleteFlg: true,
        status: booking.status === 'completed' ? 'completed' : 'cancelled',
        timeline,
      },
      connection,
    );
  });
}

/**
 * Lấy danh sách payment cho admin.
 */
export async function getAdminPaymentList() {
  return findAdminPayments();
}

/**
 * Lấy chi tiết một payment theo payment_code.
 */
export async function getAdminPaymentDetail(paymentCode) {
  const payment = await findAdminPaymentByCode(paymentCode);

  if (!payment) {
    throw new ApiError(404, 'Không tìm thấy thanh toán.');
  }

  return payment;
}

/**
 * Cập nhật trạng thái payment và đồng bộ payment_status trên booking liên quan.
 */
export async function updatePaymentStatusByAdmin(paymentCode, payload) {
  const nextStatus = String(payload?.status || '').trim();

  if (!['waiting', 'paid', 'failed'].includes(nextStatus)) {
    throw new ApiError(400, 'Trạng thái thanh toán chỉ hỗ trợ waiting, paid hoặc failed ở API này.');
  }

  return withTransaction(async (connection) => {
    const payment = await findAdminPaymentByCode(paymentCode, { includeInternal: true }, connection);

    if (!payment) {
      throw new ApiError(404, 'Không tìm thấy thanh toán.');
    }

    const booking = await findAdminBookingByRecordId(payment._bookingDbId, { includeInternal: true }, connection);

    if (!booking) {
      throw new ApiError(404, 'Không tìm thấy booking liên quan tới thanh toán.');
    }

    const timelineDetailMap = {
      failed: 'Admin đánh dấu giao dịch thất bại và giữ booking ở trạng thái chờ xử lý.',
      paid: 'Admin xác nhận thanh toán đã hoàn tất cho booking này.',
      waiting: 'Admin đưa payment về trạng thái chờ thanh toán.',
    };

    /**
     * `paidAt` chỉ được đóng dấu khi giao dịch chuyển sang `paid` lần đầu.
     * Nếu payment đã có `paidAt` từ trước thì giữ nguyên để không làm mất mốc gốc.
     */
    const updatedPayment = await updateAdminPaymentByRecordId(
      payment._paymentDbId,
      {
        paidAt: nextStatus === 'paid' && !payment.paidAt ? createSqlDateTime() : payment.paidAt,
        status: nextStatus,
      },
      connection,
    );

    /**
     * Payment và booking phải đi cùng nhau:
     * - payment_status luôn phản ánh trạng thái payment mới nhất
     * - booking đang `pending` sẽ tự chuyển sang `confirmed` khi admin xác nhận đã thanh toán
     */
    await updateAdminBookingByRecordId(
      booking._bookingDbId,
      {
        paymentStatus: nextStatus,
        status: nextStatus === 'paid' && booking.status === 'pending' ? 'confirmed' : booking.status,
        timeline: appendTimelineItem(booking.timeline, 'Admin cập nhật payment', timelineDetailMap[nextStatus]),
      },
      connection,
    );

    return updatedPayment;
  });
}

/**
 * Hoàn tiền payment đã thanh toán và đồng bộ payment_status của booking.
 */
export async function refundPaymentByAdmin(paymentCode) {
  return withTransaction(async (connection) => {
    const payment = await findAdminPaymentByCode(paymentCode, { includeInternal: true }, connection);

    if (!payment) {
      throw new ApiError(404, 'Không tìm thấy thanh toán.');
    }

    if (payment.status !== 'paid') {
      throw new ApiError(400, 'Chỉ thanh toán đã hoàn tất mới có thể hoàn tiền.');
    }

    const booking = await findAdminBookingByRecordId(payment._bookingDbId, { includeInternal: true }, connection);

    if (!booking) {
      throw new ApiError(404, 'Không tìm thấy booking liên quan tới thanh toán.');
    }

    const updatedPayment = await updateAdminPaymentByRecordId(
      payment._paymentDbId,
      {
        status: 'refunded',
      },
      connection,
    );

    // Booking không đổi trạng thái xác nhận, chỉ đổi payment_status và ghi log vận hành.
    await updateAdminBookingByRecordId(
      booking._bookingDbId,
      {
        paymentStatus: 'refunded',
        timeline: appendTimelineItem(
          booking.timeline,
          'Admin hoàn tiền',
          'Thanh toán của booking đã được hoàn tiền từ khu vực quản trị.',
        ),
      },
      connection,
    );

    return updatedPayment;
  });
}
/**
 * Khuyến mãi.
 */
export async function getAdminPromotionList() {
  return await PromotionModel.findAllPromotions();
}

export async function getAdminPromotionDetail(id) {
  const promotion = await PromotionModel.getById(id);
  if (!promotion) throw new ApiError(404, 'Không tìm thấy mã giảm giá.');
  return promotion;
}

export async function createPromotionByAdmin(data) {
  return await PromotionModel.createPromotion(data);
}

export async function updatePromotionByAdmin(id, data) {
  return await PromotionModel.updatePromotion(id, data);
}

export async function deletePromotionByAdmin(id) {
  return await PromotionModel.deletePromotion(id);
}