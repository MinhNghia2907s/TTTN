-- ==================================================
-- 007_payos_test_tours.sql
-- Du lieu tour gia thap de test thanh toan PayOS
-- Chay sau cac migration tao schema chinh
-- ==================================================

USE tour_db;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET character_set_client = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results = utf8mb4;

INSERT INTO tours (
  slug,
  title,
  location,
  departure_point,
  category,
  duration_days,
  duration_label,
  price,
  rating,
  review_count,
  image_url,
  description,
  highlights_json,
  inclusions_json,
  status,
  created_at,
  updated_at
) VALUES
  (
    'payos-test-tour-1000',
    'PayOS Test Tour 1000 VND',
    'Test Payment',
    'Online',
    'PayOS Test',
    1,
    '1 ngay',
    1000,
    5.0,
    0,
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    'Tour gia thap dung rieng de test luong thanh toan PayOS voi so tien 1.000 VND.',
    JSON_ARRAY('Gia test 1.000 VND', 'PayOS QR', 'Webhook callback'),
    JSON_ARRAY('Booking test', 'Thanh toan PayOS'),
    'published',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'payos-test-tour-2000',
    'PayOS Test Tour 2000 VND',
    'Test Payment',
    'Online',
    'PayOS Test',
    1,
    '1 ngay',
    2000,
    5.0,
    0,
    'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
    'Tour gia thap dung rieng de test luong thanh toan PayOS voi so tien 2.000 VND.',
    JSON_ARRAY('Gia test 2.000 VND', 'PayOS QR', 'Dong bo trang thai'),
    JSON_ARRAY('Booking test', 'Thanh toan PayOS'),
    'published',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  location = VALUES(location),
  departure_point = VALUES(departure_point),
  category = VALUES(category),
  duration_days = VALUES(duration_days),
  duration_label = VALUES(duration_label),
  price = VALUES(price),
  rating = VALUES(rating),
  review_count = VALUES(review_count),
  image_url = VALUES(image_url),
  description = VALUES(description),
  highlights_json = VALUES(highlights_json),
  inclusions_json = VALUES(inclusions_json),
  status = VALUES(status),
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO tour_itineraries (
  tour_id,
  day_number,
  title,
  description
)
SELECT t.id, 1, 'Tao booking test', 'Dat tour va tao ma QR PayOS de kiem tra thanh toan.'
FROM tours t
WHERE t.slug IN ('payos-test-tour-1000', 'payos-test-tour-2000')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description);

INSERT INTO tour_departures (
  tour_id,
  departure_code,
  departure_date,
  slots_total,
  slots_booked,
  price,
  label_text,
  status
)
SELECT
  t.id,
  'DEP-PAYOS-TEST-1000',
  '2026-12-01',
  50,
  0,
  1000,
  'Lich test PayOS 1.000 VND',
  'open'
FROM tours t
WHERE t.slug = 'payos-test-tour-1000'
ON DUPLICATE KEY UPDATE
  departure_date = VALUES(departure_date),
  slots_total = VALUES(slots_total),
  slots_booked = VALUES(slots_booked),
  price = VALUES(price),
  label_text = VALUES(label_text),
  status = VALUES(status);

INSERT INTO tour_departures (
  tour_id,
  departure_code,
  departure_date,
  slots_total,
  slots_booked,
  price,
  label_text,
  status
)
SELECT
  t.id,
  'DEP-PAYOS-TEST-2000',
  '2026-12-02',
  50,
  0,
  2000,
  'Lich test PayOS 2.000 VND',
  'open'
FROM tours t
WHERE t.slug = 'payos-test-tour-2000'
ON DUPLICATE KEY UPDATE
  departure_date = VALUES(departure_date),
  slots_total = VALUES(slots_total),
  slots_booked = VALUES(slots_booked),
  price = VALUES(price),
  label_text = VALUES(label_text),
  status = VALUES(status);
