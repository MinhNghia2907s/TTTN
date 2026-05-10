# Đối Chiếu Code Với Tài Liệu Tuần 2

Tài liệu tham chiếu: `C:\Users\Lenovo\Desktop\tour\tailieu\Tuần 2.docx`

Mục tiêu của file này là ghi lại mức độ bám sát giữa code hiện tại và tài liệu tuần 2, đồng thời chỉ ra các phần đã có, phần đang tương đương nhưng khác contract, và phần còn thiếu.

## Kết luận nhanh

- Chức năng cốt lõi đã có gần đủ 9 module người dùng và quản lý.
- Backend và frontend đã có đầy đủ các khu vực chính: auth, tours, bookings, payments, admin.
- Tuy nhiên code chưa bám hoàn toàn đúng tài liệu ở 3 nhóm chính:
  - tên endpoint API
  - cấu trúc một số cột database
  - module reviews mới có schema, chưa có API/UI riêng

Đánh giá tổng quan:

- Mức độ đủ module nghiệp vụ: cao
- Mức độ khớp hoàn toàn với tài liệu tuần 2: chưa hoàn toàn

## Đối chiếu module

| Module trong tài liệu | Trạng thái | Ghi chú |
| --- | --- | --- |
| Module 1: Đăng ký, đăng nhập | Gần đủ | Có `register`, `login`, `forgot-password`, `reset-password`; chưa có `logout` riêng |
| Module 2: Xem, tìm kiếm, lọc tour | Đã có | Dùng chung `GET /api/tours` với query filter, chưa tách riêng `/search` và `/filter` |
| Module 3: Xem chi tiết tour, lịch trình | Đã có nhưng khác contract | `GET /api/tours/:id` trả luôn cả itinerary và departures, chưa tách route riêng |
| Module 4: Đặt tour, thanh toán | Đã có | Có booking và payment theo luồng người dùng |
| Module 5: Xem lịch sử đặt tour, hủy tour | Đã có nhưng khác contract | Có lịch sử và hủy booking, nhưng route hủy là `PATCH /api/bookings/:bookingId/cancel` |
| Module 6: Quản lý người dùng | Đã có | Có danh sách, chi tiết, cập nhật, xóa mềm qua admin |
| Module 7: Quản lý tour | Đã có | Có quản lý tour, itinerary, departures trong admin |
| Module 8: Quản lý booking | Đã có | Có danh sách, chi tiết, cập nhật trạng thái, xóa mềm |
| Module 9: Quản lý thanh toán | Đã có | Có danh sách, chi tiết, cập nhật trạng thái, hoàn tiền |

## Danh sách API hiện đang dùng theo từng module

Phần này liệt kê API đang có trong code theo đúng cách chia module của tài liệu tuần 2.

### Module 1: Đăng ký, đăng nhập

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `PUT /api/auth/me`
- `POST /api/auth/change-password`

Ghi chú:

- Logout hiện tại đang xóa session ở frontend, không gọi API backend.

### Module 2: Xem, tìm kiếm, lọc tour

- `GET /api/tours`

Query đang hỗ trợ qua `GET /api/tours`:

- `keyword`
- `location`
- `category`
- `minPrice`
- `maxPrice`
- `minDays`
- `maxDays`

Ghi chú:

- Chức năng tìm kiếm và lọc đang được gộp vào một endpoint thay vì tách `/search` và `/filter`.

### Module 3: Xem chi tiết tour, lịch trình

- `GET /api/tours/:tourId`
- `GET /api/tours/featured`
- `GET /api/tours/testimonials`

Ghi chú:

- `GET /api/tours/:tourId` hiện trả luôn thông tin chi tiết tour, `itinerary` và `departures`.
- `featured` và `testimonials` là API mở rộng ngoài tài liệu.

### Module 4: Đặt tour, thanh toán

- `POST /api/bookings`
- `POST /api/payments`
- `GET /api/payments/:bookingId`

### Module 5: Xem lịch sử đặt tour, hủy tour

- `GET /api/bookings`
- `GET /api/bookings/:bookingId`
- `PATCH /api/bookings/:bookingId/cancel`

Ghi chú:

- `GET /api/bookings` đang đóng vai trò tương đương `GET /api/bookings/my`.
- Hủy booking đang dùng `PATCH /cancel`, không dùng `DELETE`.

### Module 6: Quản lý người dùng

- `GET /api/admin/meta`
- `GET /api/admin/users`
- `GET /api/admin/users/:userId`
- `PUT /api/admin/users/:userId`
- `DELETE /api/admin/users/:userId`

### Module 7: Quản lý tour

- `GET /api/admin/tours`
- `GET /api/admin/tours/:tourId`
- `POST /api/admin/tours`
- `PUT /api/admin/tours/:tourId`
- `DELETE /api/admin/tours/:tourId`

Ghi chú:

- Payload tạo và sửa tour hiện đang xử lý luôn itinerary và departures trong cùng luồng admin.

### Module 8: Quản lý booking

API hiện đang dùng:

- `GET /api/admin/bookings`
- `GET /api/admin/bookings/:bookingCode`
- `PUT /api/admin/bookings/:bookingCode/status`
- `DELETE /api/admin/bookings/:bookingCode`

Ghi chú:

- Admin đang dùng `bookingCode` thay vì id số thuần như trong tài liệu.

### Module 9: Quản lý thanh toán

API hiện đang dùng:

- `GET /api/admin/payments`
- `GET /api/admin/payments/:paymentCode`
- `PUT /api/admin/payments/:paymentCode/status`
- `POST /api/admin/payments/refund/:paymentCode`

Ghi chú:

- Admin đang dùng `paymentCode` thay vì id số thuần như trong tài liệu.

## Đối chiếu API

### Module 1: Auth

Theo tài liệu:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

Hiện tại trong code:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `PUT /api/auth/me`
- `POST /api/auth/change-password`

Kết luận:

- Đã có gần đủ auth cơ bản.
- Thiếu `POST /api/auth/logout` nếu bám đúng tài liệu.
- Có mở rộng thêm các API profile và refresh token ngoài phạm vi tài liệu.

File liên quan:

- `server/src/routes/authRoutes.js`
- `server/src/controllers/authController.js`

### Module 2 và 3: Tours

Theo tài liệu:

- `GET /api/tours`
- `GET /api/tours/search?q=`
- `GET /api/tours/filter?destination=&priceMin=&priceMax=&duration=`
- `GET /api/tours/:id`
- `GET /api/tours/:id/schedule`
- `GET /api/tours/:id/departures`

Hiện tại trong code:

- `GET /api/tours`
- `GET /api/tours/featured`
- `GET /api/tours/testimonials`
- `GET /api/tours/:tourId`

Kết luận:

- Chức năng xem danh sách, tìm kiếm, lọc tour đã có qua query string của `GET /api/tours`.
- Chức năng xem lịch trình và danh sách ngày khởi hành cũng đã có, nhưng đang được trả gộp trong `GET /api/tours/:tourId`.
- Chưa bám đúng endpoint như tài liệu vì chưa tách `/search`, `/filter`, `/schedule`, `/departures`.

File liên quan:

- `server/src/routes/tourRoutes.js`
- `server/src/services/tourService.js`
- `server/src/models/tourModel.js`

### Module 4 và 5: Bookings và Payments

Theo tài liệu:

- `POST /api/bookings`
- `POST /api/payments`
- `GET /api/payments/:bookingId`
- `GET /api/bookings/my`
- `GET /api/bookings/:id`
- `DELETE /api/bookings/:id`

Hiện tại trong code:

- `GET /api/bookings`
- `POST /api/bookings`
- `GET /api/bookings/:bookingId`
- `PATCH /api/bookings/:bookingId/cancel`
- `GET /api/payments/:bookingId`
- `POST /api/payments`

Kết luận:

- Luồng đặt tour, xem lịch sử, xem chi tiết booking, thanh toán đã có.
- Chưa khớp hoàn toàn tài liệu ở 2 điểm:
  - `GET /api/bookings` được dùng thay cho `GET /api/bookings/my`
  - hủy booking dùng `PATCH /cancel` thay vì `DELETE`

File liên quan:

- `server/src/routes/bookingRoutes.js`
- `server/src/routes/paymentRoutes.js`
- `client/src/routes/AppRoutes.jsx`

### Module 6 đến 9: Admin

Theo tài liệu:

- users: list, detail, update, delete
- tours: list, create, update, delete
- bookings: list, detail, update status, delete
- payments: list, detail, update status, refund

Hiện tại trong code:

- Đã có đầy đủ 4 nhóm route admin tương ứng
- Có thêm `GET /api/admin/meta`
- Phân quyền `admin` và `staff` đã được triển khai theo permission

Kết luận:

- Nhóm module quản lý đã khá sát tài liệu.
- Khác biệt chính là tham số đang dùng `bookingCode` và `paymentCode` ở một số route admin thay vì id số thuần.

File liên quan:

- `server/src/routes/adminRoutes.js`
- `client/src/pages/admin`

## Đối chiếu frontend theo màn hình

Màn hình người dùng hiện có:

- Trang chủ
- Danh sách tour
- Chi tiết tour
- Đăng ký
- Đăng nhập
- Quên mật khẩu
- Đặt lại mật khẩu
- Hồ sơ tài khoản
- Đổi mật khẩu
- Đặt tour
- Thanh toán
- Lịch sử booking
- Chi tiết booking

Màn hình quản trị hiện có:

- Đăng nhập admin
- Dashboard
- Quản lý người dùng
- Chi tiết người dùng
- Quản lý tour
- Tạo tour
- Sửa tour
- Quản lý booking
- Chi tiết booking
- Quản lý thanh toán
- Chi tiết thanh toán

Kết luận:

- Về mặt UI, các module chính của tuần 2 đã có mặt.
- Chưa thấy màn hình riêng cho reviews.

File liên quan:

- `client/src/routes/AppRoutes.jsx`

## Đối chiếu database

### Các bảng chính đã có

- `users`
- `tours`
- `tour_itineraries`
- `tour_departures`
- `bookings`
- `payments`
- `reviews`

Ngoài ra code còn có thêm:

- `testimonials`

### Các điểm khớp

- Các bảng nghiệp vụ chính của đề tài đã tồn tại.
- Các quan hệ lớn giữa users, tours, departures, bookings, payments, reviews đã được thiết kế.

### Các điểm chưa khớp hoàn toàn với tài liệu

#### Bảng `users`

Tài liệu mong muốn:

- `password`
- `address`
- `delete_flg`

Code hiện tại:

- dùng `password_hash`
- chưa có `address`
- `delete_flg` chỉ được bổ sung ở migration mở rộng admin

#### Bảng `tours`

Tài liệu mong muốn:

- `destination`
- `transport`
- `thumbnail`
- `images`
- `delete_flg`

Code hiện tại:

- dùng `location`
- có `departure_point`, `category`, `duration_label`, `image_url`
- chưa có `transport`, `thumbnail`, `images` đúng tên tài liệu
- `delete_flg` được thêm ở migration admin

#### Bảng `tour_itineraries`

Tài liệu mong muốn:

- có `images`
- có `delete_flg`
- có `updated_at`

Code hiện tại:

- chưa có các cột này

#### Bảng `tour_departures`

Tài liệu mong muốn:

- `return_date`
- `available_slots`
- `booked_slots`
- `delete_flg`

Code hiện tại:

- dùng `slots_total` và `slots_booked`
- chưa có `return_date`
- chưa có `delete_flg`

#### Bảng `bookings`

Tài liệu mong muốn:

- `quantity`
- `total_amount`
- `booking_status`
- `delete_flg`

Code hiện tại:

- dùng `travelers_count`
- dùng `total_price`
- dùng `status`
- `delete_flg` được thêm trong migration admin

#### Bảng `payments`

Tài liệu mong muốn:

- `transaction_code`
- `delete_flg`

Code hiện tại:

- dùng `payment_code`
- chưa có `transaction_code`
- chưa có `delete_flg`

#### Bảng `reviews`

Tài liệu mong muốn:

- `comment`
- `status`
- `delete_flg`
- `updated_at`

Code hiện tại:

- dùng `title`, `content`, `is_featured`
- chưa có `status`, `delete_flg`, `updated_at`

File liên quan:

- `server/migrations/001_create_tour_db.sql`
- `server/migrations/004_admin_backend_extensions.sql`

## Phần đã có nhưng khác cách triển khai

Các mục sau không hẳn là thiếu, nhưng cần lưu ý vì code triển khai khác tài liệu:

- Search và filter tour gộp vào `GET /api/tours` bằng query string.
- Chi tiết tour trả luôn itinerary và departures, không tách endpoint.
- Hủy booking dùng `PATCH` thay vì `DELETE`.
- Admin dùng `bookingCode` và `paymentCode` ở nhiều route.
- Hệ thống có thêm `refresh token`, profile user, dashboard admin, testimonials.

## Phần còn thiếu hoặc chưa rõ

- Chưa có API `logout` riêng.
- Chưa có module review hoàn chỉnh ở mức route và UI.
- Schema chưa đồng nhất hoàn toàn với danh sách cột trong tài liệu.

## Đề xuất nếu muốn bám sát tài liệu hơn

1. Thêm `POST /api/auth/logout`.
2. Bổ sung alias route cho các API trong tài liệu:
   - `/api/tours/search`
   - `/api/tours/filter`
   - `/api/tours/:id/schedule`
   - `/api/tours/:id/departures`
   - `/api/bookings/my`
   - `DELETE /api/bookings/:id`
3. Quyết định rõ tài liệu là đặc tả bắt buộc hay chỉ là định hướng.
4. Nếu coi tài liệu là chuẩn chính thức, cần tạo migration để đồng bộ schema hoặc cập nhật lại tài liệu cho đúng với code hiện tại.
5. Nếu reviews là module bắt buộc của đề tài, cần bổ sung route, service và UI tương ứng.

## File đã dùng để đối chiếu

- `server/src/routes/index.js`
- `server/src/routes/authRoutes.js`
- `server/src/routes/tourRoutes.js`
- `server/src/routes/bookingRoutes.js`
- `server/src/routes/paymentRoutes.js`
- `server/src/routes/adminRoutes.js`
- `server/src/models/tourModel.js`
- `server/migrations/001_create_tour_db.sql`
- `server/migrations/004_admin_backend_extensions.sql`
- `client/src/routes/AppRoutes.jsx`
