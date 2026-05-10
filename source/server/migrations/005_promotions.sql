-- ==================================================
-- 005_promotions.sql
-- Them chuc nang ma khuyen mai cho booking tour
-- Chay sau 004_admin_backend_extensions.sql
-- ==================================================

USE tour_db;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET character_set_client = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results = utf8mb4;

-- Bang promotions luu ma giam gia co dinh. Dieu kien mua nhieu duoc dat bang min_travelers.
CREATE TABLE IF NOT EXISTS promotions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  discount_type ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent',
  discount_value DECIMAL(12, 0) NOT NULL,
  min_travelers INT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_promotions_code (code)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Luu lai gia truoc giam, so tien da giam va ma da ap dung tren tung booking.
-- MySQL se bao loi Duplicate column neu chay lai ALTER TABLE truc tiep,
-- nen moi cot duoc kiem tra trong information_schema truoc khi them.
SET @has_subtotal_price = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'subtotal_price'
);
SET @alter_subtotal_price = IF(
  @has_subtotal_price = 0,
  'ALTER TABLE bookings ADD COLUMN subtotal_price DECIMAL(12, 0) NOT NULL DEFAULT 0 AFTER travelers_count',
  'SELECT "subtotal_price already exists"'
);
PREPARE stmt FROM @alter_subtotal_price;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_discount_amount = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'discount_amount'
);
SET @alter_discount_amount = IF(
  @has_discount_amount = 0,
  'ALTER TABLE bookings ADD COLUMN discount_amount DECIMAL(12, 0) NOT NULL DEFAULT 0 AFTER subtotal_price',
  'SELECT "discount_amount already exists"'
);
PREPARE stmt FROM @alter_discount_amount;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_promotion_code = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'promotion_code'
);
SET @alter_promotion_code = IF(
  @has_promotion_code = 0,
  'ALTER TABLE bookings ADD COLUMN promotion_code VARCHAR(50) NULL AFTER discount_amount',
  'SELECT "promotion_code already exists"'
);
PREPARE stmt FROM @alter_promotion_code;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Booking cu chua co khuyen mai thi gia truoc giam bang tong tien hien tai.
SET SQL_SAFE_UPDATES = 0;

UPDATE bookings
SET subtotal_price = total_price
WHERE subtotal_price = 0;

SET SQL_SAFE_UPDATES = 1;

-- Ma khuyen mai co dinh dung cho do an: di tu 3 khach tro len se duoc giam 10%.
INSERT INTO promotions (
  code,
  name,
  discount_type,
  discount_value,
  min_travelers,
  status
)
VALUES (
  'TOURGROUP10',
  'Giam 10% cho nhom tu 3 khach',
  'percent',
  10,
  3,
  'active'
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  discount_type = VALUES(discount_type),
  discount_value = VALUES(discount_value),
  min_travelers = VALUES(min_travelers),
  status = VALUES(status),
  updated_at = CURRENT_TIMESTAMP;
