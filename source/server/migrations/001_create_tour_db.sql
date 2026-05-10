-- ==================================================
-- 001_create_tour_db.sql
-- Tao database va cac bang chinh cho web dat tour
-- Tên database đang đồng bộ với source/.env
-- ==================================================

CREATE DATABASE IF NOT EXISTS tour_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tour_db;

-- Xoa bang theo thu tu khoa ngoai neu can chay lai script trong luc phat trien
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS testimonials;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS tour_departures;
DROP TABLE IF EXISTS tour_itineraries;
DROP TABLE IF EXISTS tours;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(150) NOT NULL,
  username VARCHAR(80) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin', 'staff') NOT NULL DEFAULT 'user',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_phone (phone)
);

CREATE TABLE tours (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(180) NOT NULL,
  title VARCHAR(255) NOT NULL,
  location VARCHAR(150) NOT NULL,
  departure_point VARCHAR(150) NOT NULL,
  category VARCHAR(120) NOT NULL,
  duration_days SMALLINT UNSIGNED NOT NULL,
  duration_label VARCHAR(80) NOT NULL,
  price DECIMAL(12, 0) NOT NULL,
  rating DECIMAL(2, 1) NOT NULL DEFAULT 0,
  review_count INT UNSIGNED NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL,
  description TEXT NOT NULL,
  highlights_json JSON NULL,
  inclusions_json JSON NULL,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'published',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tours_slug (slug),
  KEY idx_tours_location (location),
  KEY idx_tours_category (category),
  KEY idx_tours_price (price)
);

CREATE TABLE tour_itineraries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tour_id BIGINT UNSIGNED NOT NULL,
  day_number SMALLINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tour_day (tour_id, day_number),
  CONSTRAINT fk_itineraries_tour
    FOREIGN KEY (tour_id) REFERENCES tours(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE tour_departures (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tour_id BIGINT UNSIGNED NOT NULL,
  departure_code VARCHAR(100) NOT NULL,
  departure_date DATE NOT NULL,
  slots_total INT UNSIGNED NOT NULL,
  slots_booked INT UNSIGNED NOT NULL DEFAULT 0,
  price DECIMAL(12, 0) NOT NULL,
  label_text VARCHAR(120) NOT NULL,
  status ENUM('open', 'closed', 'completed') NOT NULL DEFAULT 'open',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_departure_code (departure_code),
  KEY idx_departures_tour_date (tour_id, departure_date),
  CONSTRAINT fk_departures_tour
    FOREIGN KEY (tour_id) REFERENCES tours(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE bookings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_code VARCHAR(100) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  tour_id BIGINT UNSIGNED NOT NULL,
  departure_id BIGINT UNSIGNED NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_email VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  travelers_count INT UNSIGNED NOT NULL,
  total_price DECIMAL(12, 0) NOT NULL,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  payment_status ENUM('waiting', 'paid', 'refunded') NOT NULL DEFAULT 'waiting',
  payment_method VARCHAR(100) NULL,
  notes TEXT NULL,
  timeline_json JSON NULL,
  booked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_booking_code (booking_code),
  KEY idx_bookings_user (user_id),
  KEY idx_bookings_tour (tour_id),
  KEY idx_bookings_departure (departure_id),
  CONSTRAINT fk_bookings_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_bookings_tour
    FOREIGN KEY (tour_id) REFERENCES tours(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_bookings_departure
    FOREIGN KEY (departure_id) REFERENCES tour_departures(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE TABLE payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_code VARCHAR(100) NOT NULL,
  booking_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12, 0) NOT NULL,
  method VARCHAR(100) NOT NULL,
  status ENUM('waiting', 'paid', 'refunded', 'failed') NOT NULL DEFAULT 'waiting',
  card_name VARCHAR(150) NULL,
  card_last4 VARCHAR(10) NULL,
  paid_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_code (payment_code),
  KEY idx_payments_booking (booking_id),
  KEY idx_payments_user (user_id),
  CONSTRAINT fk_payments_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_payments_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE TABLE reviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tour_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  booking_id BIGINT UNSIGNED NULL,
  rating TINYINT UNSIGNED NOT NULL,
  title VARCHAR(180) NULL,
  content TEXT NOT NULL,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_reviews_tour (tour_id),
  KEY idx_reviews_user (user_id),
  CONSTRAINT fk_reviews_tour
    FOREIGN KEY (tour_id) REFERENCES tours(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

CREATE TABLE testimonials (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_name VARCHAR(150) NOT NULL,
  role_label VARCHAR(150) NOT NULL,
  content TEXT NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);
