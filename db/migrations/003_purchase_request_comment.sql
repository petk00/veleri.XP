-- ============================================================
-- Migration 003: Dodavanje kolone `comment` na PurchaseRequest
--
-- Pohranjuje opcionalni komentar podnositelja zahtjeva unesen
-- na koraku Pregled u wizardu za novi zahtjev.
--
-- Pokretanje:
--   mysql -u veleri -p XP < db/migrations/003_purchase_request_comment.sql
-- ============================================================

ALTER TABLE `PurchaseRequest`
  ADD COLUMN `comment` VARCHAR(500) NULL DEFAULT NULL
  AFTER `justification`;

SELECT 'OK: Kolona comment dodana na PurchaseRequest.' AS status;
