-- ==================================================
-- 004_admin_backend_extensions.sql
-- Mở rộng schema để phục vụ backend phần admin
-- ==================================================

USE tour_db;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET character_set_client = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results = utf8mb4;

-- Admin cần khóa mềm user và cần thêm trạng thái blocked để chặn đăng nhập hoặc sử dụng.
ALTER TABLE users
MODIFY COLUMN status ENUM('active', 'inactive', 'blocked') NOT NULL DEFAULT 'active';

ALTER TABLE users
ADD COLUMN delete_flg TINYINT(1) NOT NULL DEFAULT 0 AFTER status;

-- Tour admin cần tạm ẩn và khóa mềm trước khi xóa thật.
ALTER TABLE tours
MODIFY COLUMN status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'published';

ALTER TABLE tours
ADD COLUMN delete_flg TINYINT(1) NOT NULL DEFAULT 0 AFTER status;

-- Lịch khởi hành cần có trạng thái nearly_full để admin theo dõi các đợt sắp đầy chỗ.
ALTER TABLE tour_departures
MODIFY COLUMN status ENUM('open', 'nearly_full', 'closed', 'completed') NOT NULL DEFAULT 'open';

-- Booking admin cần khóa mềm và có thêm trạng thái failed để đồng bộ với payment.
ALTER TABLE bookings
MODIFY COLUMN payment_status ENUM('waiting', 'paid', 'refunded', 'failed') NOT NULL DEFAULT 'waiting';

ALTER TABLE bookings
ADD COLUMN delete_flg TINYINT(1) NOT NULL DEFAULT 0 AFTER status;
