-- ============================================================
-- Migration 004: Preimenovanje statusa 3
--
-- Mijenja naziv statusa s 'Vraćeno na dopunu / izmjenu'
-- u 'Zahtjeva izmjene'.
--
-- Pokretanje:
--   mysql -u veleri -p XP < db/migrations/004_rename_status_zahtjeva_izmjene.sql
-- ============================================================

UPDATE `RequestStatus`
SET `name` = 'Zahtjeva izmjene'
WHERE `id_request_status` = 3;

SELECT 'OK: Status 3 preimenovan u Zahtjeva izmjene.' AS status;
