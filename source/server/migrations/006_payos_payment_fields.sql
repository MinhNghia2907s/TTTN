-- ==================================================
-- 006_payos_payment_fields.sql
-- Bo sung cac truong doi soat PayOS cho bang payments
-- ==================================================

USE tour_db;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE payments
  ADD COLUMN provider VARCHAR(50) NULL AFTER paid_at,
  ADD COLUMN provider_order_code BIGINT NULL AFTER provider,
  ADD COLUMN provider_payment_link_id VARCHAR(120) NULL AFTER provider_order_code,
  ADD COLUMN checkout_url TEXT NULL AFTER provider_payment_link_id,
  ADD COLUMN qr_code TEXT NULL AFTER checkout_url,
  ADD COLUMN provider_status VARCHAR(50) NULL AFTER qr_code,
  ADD UNIQUE KEY uq_payments_provider_order_code (provider_order_code);
