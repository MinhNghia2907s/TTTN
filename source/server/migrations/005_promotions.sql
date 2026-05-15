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

-- ==================================================
-- TABLE: promotions
-- ==================================================

CREATE TABLE IF NOT EXISTS promotions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  code VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,

  discount_type ENUM('percent', 'fixed')
    NOT NULL DEFAULT 'percent',

  discount_value DECIMAL(12,0) NOT NULL,

  min_travelers INT UNSIGNED NOT NULL DEFAULT 1,

  status ENUM('active', 'inactive')
    NOT NULL DEFAULT 'active',

  starts_at DATETIME NULL,
  ends_at DATETIME NULL,

  created_at DATETIME NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  updated_at DATETIME NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_promotions_code (code),

  KEY idx_promotions_status (status),

  CONSTRAINT chk_promotions_discount_value
    CHECK (
      discount_value > 0
    ),

  CONSTRAINT chk_promotions_min_travelers
    CHECK (
      min_travelers >= 1
    ),

  CONSTRAINT chk_promotions_date_range
    CHECK (
      starts_at IS NULL
      OR ends_at IS NULL
      OR starts_at <= ends_at
    ),

  CONSTRAINT chk_promotions_percent_limit
    CHECK (
      (
        discount_type = 'percent'
        AND discount_value <= 100
      )
      OR discount_type = 'fixed'
    ),

  CONSTRAINT chk_promotions_code_length
    CHECK (
      CHAR_LENGTH(TRIM(code)) >= 3
    ),

  CONSTRAINT chk_promotions_name_length
    CHECK (
      CHAR_LENGTH(TRIM(name)) >= 5
    )

) CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- ==================================================
-- THEM CAC COT KHUYEN MAI VAO BOOKINGS
-- ==================================================

-- subtotal_price

SET @has_subtotal_price = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'subtotal_price'
);

SET @sql = IF(
  @has_subtotal_price = 0,
  '
    ALTER TABLE bookings
    ADD COLUMN subtotal_price DECIMAL(12,0)
    NOT NULL DEFAULT 0
    AFTER travelers_count
  ',
  'SELECT "subtotal_price already exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- discount_amount

SET @has_discount_amount = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'discount_amount'
);

SET @sql = IF(
  @has_discount_amount = 0,
  '
    ALTER TABLE bookings
    ADD COLUMN discount_amount DECIMAL(12,0)
    NOT NULL DEFAULT 0
    AFTER subtotal_price
  ',
  'SELECT "discount_amount already exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- promotion_id

SET @has_promotion_id = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'promotion_id'
);

SET @sql = IF(
  @has_promotion_id = 0,
  '
    ALTER TABLE bookings
    ADD COLUMN promotion_id BIGINT UNSIGNED NULL
    AFTER discount_amount
  ',
  'SELECT "promotion_id already exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- promotion_code

SET @has_promotion_code = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'promotion_code'
);

SET @sql = IF(
  @has_promotion_code = 0,
  '
    ALTER TABLE bookings
    ADD COLUMN promotion_code VARCHAR(50) NULL
    AFTER promotion_id
  ',
  'SELECT "promotion_code already exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==================================================
-- THEM FOREIGN KEY CHO promotion_id
-- ==================================================

SET @has_fk_promotion = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND CONSTRAINT_NAME = 'fk_bookings_promotion'
);

SET @sql = IF(
  @has_fk_promotion = 0,
  '
    ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_promotion
    FOREIGN KEY (promotion_id)
    REFERENCES promotions(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
  ',
  'SELECT "fk_bookings_promotion already exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==================================================
-- THEM INDEX CHO promotion_id
-- ==================================================

SET @has_idx_promotion = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND INDEX_NAME = 'idx_bookings_promotion'
);

SET @sql = IF(
  @has_idx_promotion = 0,
  '
    ALTER TABLE bookings
    ADD KEY idx_bookings_promotion (promotion_id)
  ',
  'SELECT "idx_bookings_promotion already exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==================================================
-- THEM INDEX CHO promotion_code
-- ==================================================

SET @has_idx_promotion_code = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND INDEX_NAME = 'idx_bookings_promotion_code'
);

SET @sql = IF(
  @has_idx_promotion_code = 0,
  '
    ALTER TABLE bookings
    ADD KEY idx_bookings_promotion_code (promotion_code)
  ',
  'SELECT "idx_bookings_promotion_code already exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==================================================
-- THEM CHECK CONSTRAINT CHO BOOKINGS
-- ==================================================

SET @has_chk_booking_price = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND CONSTRAINT_NAME = 'chk_bookings_price'
);

SET @sql = IF(
  @has_chk_booking_price = 0,
  '
    ALTER TABLE bookings
    ADD CONSTRAINT chk_bookings_price
    CHECK (
      subtotal_price >= 0
      AND discount_amount >= 0
      AND total_price >= 0
      AND discount_amount <= subtotal_price
    )
  ',
  'SELECT "chk_bookings_price already exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==================================================
-- CAP NHAT BOOKING CU
-- ==================================================

SET SQL_SAFE_UPDATES = 0;

UPDATE bookings
SET subtotal_price = total_price
WHERE subtotal_price = 0;

SET SQL_SAFE_UPDATES = 1;

-- ==================================================
-- SEED DU LIEU PROMOTION MAC DINH
-- ==================================================

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