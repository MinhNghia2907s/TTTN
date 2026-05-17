# Website bán gói tour du lịch Chill n Free

Website đặt tour du lịch với cấu trúc `client/server`, dùng chung `package.json`, `node_modules` và file `.env` tại thư mục `source`.

## Yêu cầu môi trường

- Node.js 18 trở lên
- npm 9 trở lên

## Công nghệ sử dụng

- Frontend: ReactJS
- UI styling: Tailwind CSS
- Backend: Node.js + ExpressJS
- Database: MySQL
- Gọi API từ frontend: Axios
- Điều hướng trang: React Router DOM
- Mã hóa mật khẩu: bcrypt
- Xác thực đăng nhập: JWT
- Kết nối MySQL: mysql2
- PayOS

## Cấu trúc thư mục

```text
source/
  .env
  .env.example
  package.json
  nodemon.json
  vite.config.js
  client/
    public/
    src/
      pages/
        admin/
        user/
      services/
        admin/
        shared/
        user/
    index.html
  server/
    app.js
    server.js
    migrations/
    src/
  dist/
```

- `client`: frontend React + Vite + Tailwind CSS
- `client/src/pages/user`: nhóm page giao diện người dùng
- `client/src/pages/admin`: nhóm page giao diện quản trị admin/staff
- `client/src/services/user`: nhóm service cho luồng người dùng và gọi API thật
- `client/src/services/admin`: nhóm service cho luồng quản trị admin/staff
- `client/src/services/shared`: service dùng chung như theme
- `server`: backend Express + API người dùng + migrations SQL
- `.env`: file biến môi trường dùng chung cho cả frontend và backend
- `dist`: bản build frontend để backend serve ở môi trường production

## Cài đặt

```bash
npm install
```

## Chạy project ở môi trường phát triển

Project hiện được cấu hình để frontend và backend cùng chạy trên một địa chỉ:

- [http://localhost:4000](http://localhost:4000)

Chạy lệnh:

```bash
npm run dev
```

Giải thích:

- `npm run dev`: chạy Express + Vite middleware trên cùng port `4000`
- `npm run dev:server`: chạy riêng backend bằng `nodemon`
- `npm run dev:client`: chạy riêng frontend Vite trên `5173`

## Build và chạy production local

Build frontend:

```bash
npm run build
```

Sau đó chạy backend để serve luôn frontend build:

```bash
npm run start:server
```

Khi đó ứng dụng cũng truy cập tại:

- [http://localhost:4000](http://localhost:4000)

## Cấu hình `.env`

Project dùng chung:

- [`.env`](/Desktop/TTTN/source/.env)
- [`.env.example`](/Desktop/TTTN/source/.env.example)

Các nhóm biến chính:

```env
APP_NAME=Website bán gói tour du lịch Chill n Free
APP_ENV=development

PORT=4000
VITE_APP_NAME=Website bán gói tour du lịch Chill n Free
VITE_HERO_EFFECT=leaves
VITE_HERO_EFFECT_COUNT=18
VITE_HERO_EFFECT_SPEED=1
VITE_HERO_EFFECT_SCALE=1
VITE_HERO_EFFECT_OPACITY=0.72

DB_HOST=localhost
DB_PORT=3306
DB_NAME=tour_db
DB_USER=root
DB_PASSWORD=

JWT_SECRET=change_me_for_real_project
REFRESH_TOKEN_SECRET=change_me_for_real_project_refresh
ACCESS_TOKEN_EXPIRES_IN=7h
REFRESH_TOKEN_EXPIRES_IN=1d
```

Lưu ý:

- Biến bắt đầu bằng `VITE_` sẽ được frontend sử dụng
- `PORT` là cổng dùng chung, backend sẽ tự suy ra URL app là `http://localhost:${PORT}`
- API frontend và backend đang cố định cùng dùng tiền tố `/api` ngay trong code
- Access token hiện hết hạn sau `7h`, refresh token hết hạn sau `1d`
- Cần đổi `JWT_SECRET` khi triển khai môi trường thật

Hiệu ứng hero có thể đổi nhanh bằng env:

- `VITE_HERO_EFFECT=leaves`: lá rơi
- `VITE_HERO_EFFECT=particles`: hạt sáng bay
- `VITE_HERO_EFFECT=stars`: sao rơi
- `VITE_HERO_EFFECT=snow`: tuyết rơi
- `VITE_HERO_EFFECT=petals`: cánh hoa rơi
- `VITE_HERO_EFFECT=clouds`: mây trôi
- `VITE_HERO_EFFECT=birds`: chim bay
- `VITE_HERO_EFFECT=sparkles`: nắng lấp lánh
- `VITE_HERO_EFFECT=none`: tắt hiệu ứng

## Database và seed dữ liệu

Thư mục SQL hiện có tại:

- [server/migrations/001_create_tour_db.sql](/Desktop/TTTN/source/server/migrations/001_create_tour_db.sql)
- [server/migrations/002_data_seed.sql](/Desktop/TTTN/source/server/migrations/002_data_seed.sql)
- [server/migrations/003_password_reset_tokens.sql](/Desktop/TTTN/source/server/migrations/003_password_reset_tokens.sql)

Thứ tự chạy:

1. Tạo database và bảng bằng `001_create_tour_db.sql`
2. Seed dữ liệu mẫu bằng `002_data_seed.sql`
3. Tạo bảng token đặt lại mật khẩu bằng `003_password_reset_tokens.sql`
4. Bankend cho phần admin `004_admin_backend_extensions.sql`
5. Database mã giảm giá `005_promotions.sql`
6. PayOS `006_payos_payment_fields.sql`
7. Test PayOS `007_payos_test_tours.sql`
Database mẫu đang dùng tên:

- `tour_db`

## Tài khoản demo

Có sẵn tài khoản demo để kiểm tra nhanh các luồng chính:

- Người dùng frontend: `dh52100953user` / `123456`
- Admin portal: `dh52100953admin01` / `123456`
- Staff portal: `dh52100953staff01` / `123456`

Các luồng tài khoản người dùng hiện có:

- Đăng ký tài khoản mới và tự động đăng nhập
- Đăng nhập bằng email hoặc tên đăng nhập
- Quên mật khẩu và đặt lại mật khẩu qua reset token
- Cài đặt tài khoản để cập nhật họ tên, email, số điện thoại
- Đổi mật khẩu khi đang đăng nhập
- Đăng xuất từ menu tài khoản trên header

## Phân quyền admin/staff

Portal `/admin` hiện có 2 role nội bộ:

- `admin`: toàn quyền khu vực quản trị
- `staff`: quyền vận hành hằng ngày, không có quyền thao tác nhạy cảm

Permission backend đang được chặn theo từng endpoint tại:

- [server/src/routes/adminRoutes.js](/Desktop/TTTN/source/server/src/routes/adminRoutes.js)
- [server/src/middlewares/adminMiddleware.js](/Desktop/TTTN/source/server/src/middlewares/adminMiddleware.js)

Permission frontend đang được đồng bộ theo session admin tại:

- [client/src/services/admin/adminAuthService.js](/Desktop/TTTN/source/client/src/services/admin/adminAuthService.js)

Ma trận quyền theo từng trang đã làm trong code:

| Trang | Route | Admin | Staff |
|---|---|---|---|
| Dashboard | `/admin` | Xem toàn bộ dashboard, KPI, booking gần đây, payment gần đây | Xem như admin |
| Quản lý người dùng | `/admin/users` | Xem danh sách, vào chi tiết, đổi role, đổi status, khóa/mở, xóa mềm/khôi phục | Chỉ xem danh sách và vào trang chi tiết |
| Chi tiết người dùng | `/admin/users/:userId` | Sửa hồ sơ, đổi role, đổi status, xóa mềm/khôi phục | Chỉ xem thông tin và booking gần đây |
| Danh sách tour | `/admin/tours` | Xem, thêm tour, sửa tour, đổi trạng thái, xóa mềm/khôi phục | Xem, thêm tour, sửa tour, đổi trạng thái |
| Tạo tour | `/admin/tours/new` | Được tạo tour mới | Được tạo tour mới |
| Chỉnh sửa tour | `/admin/tours/:tourId/edit` | Sửa toàn bộ tour, itinerary, departures, xóa mềm/khôi phục | Sửa toàn bộ tour, itinerary, departures; không có nút xóa mềm |
| Danh sách booking | `/admin/bookings` | Xem, vào chi tiết, cập nhật trạng thái, xóa mềm | Xem, vào chi tiết, cập nhật trạng thái |
| Chi tiết booking | `/admin/bookings/:bookingCode` | Xem chi tiết, xem timeline, cập nhật trạng thái, xóa mềm | Xem chi tiết, xem timeline, cập nhật trạng thái |
| Danh sách payment | `/admin/payments` | Xem, vào chi tiết, cập nhật trạng thái, hoàn tiền nhanh | Xem, vào chi tiết, cập nhật trạng thái; không hoàn tiền |
| Chi tiết payment | `/admin/payments/:paymentCode` | Xem chi tiết, đổi trạng thái, hoàn tiền | Xem chi tiết, đổi trạng thái; không có nút hoàn tiền |

Các nghiệp vụ nhạy cảm hiện chỉ `admin` mới có:

- Quản lý role/status/xóa mềm user
- Xóa mềm hoặc khôi phục tour
- Xóa mềm booking
- Hoàn tiền payment

## Tình trạng hiện tại

- Frontend người dùng đã có giao diện và đã nối với backend
- Thư mục page frontend đã được tách rõ thành `client/src/pages/user` và `client/src/pages/admin`
- Thư mục service frontend đã được tách rõ thành `client/src/services/user`, `client/src/services/admin` và `client/src/services/shared`
- Backend đang chạy bằng Express và đọc dữ liệu người dùng trực tiếp từ MySQL theo cấu hình trong `.env`
- Header người dùng đã dùng nút tài khoản dạng dropdown, dẫn tới trang cài đặt tài khoản, đổi mật khẩu và đăng xuất
- Luồng chính đã có: đăng ký, đăng nhập, quên mật khẩu, đặt lại mật khẩu, cập nhật hồ sơ, đổi mật khẩu, xem tour, xem chi tiết tour, đặt tour, thanh toán, lịch sử booking
- Portal admin đã nối backend thật cho dashboard, người dùng, tour, booking và payment

## Lệnh hay dùng

```bash
npm run dev
npm run dev:server
npm run dev:client
npm run build
npm run start:server
```

## Ghi chú

- Hãy chạy lệnh tại thư mục `source`
- Nếu port `4000` đang bận, cần dừng tiến trình cũ trước khi chạy lại
- Khi chạy development bằng `npm run dev`, backend là entry chính và Vite được mount vào Express
