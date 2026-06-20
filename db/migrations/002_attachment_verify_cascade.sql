-- ============================================================
-- Migration 002: Verifikacija ON DELETE CASCADE na Attachment.fk_purchase_request
--
-- NAPOMENA: ON DELETE CASCADE već postoji u schema.sql (linija 166).
-- Ova migracija:
--   1. Provjerava nema orphan Attachment zapisa
--   2. Provjerava je li FK constraint ispravno konfiguriran u bazi
--   3. Ako constraint nedostaje ili nema CASCADE → drop + re-add
--
-- Pokretanje:
--   mysql -u veleri -p XP < db/migrations/002_attachment_verify_cascade.sql
-- ============================================================

-- Dijagnostički upit — pokreni PRVO ručno:
--
--   SELECT a.id_attachment, a.fk_purchase_request, a.original_filename, a.uploaded_at
--   FROM Attachment a
--   LEFT JOIN PurchaseRequest pr ON a.fk_purchase_request = pr.id_purchase_request
--   WHERE pr.id_purchase_request IS NULL;
--
-- Ako vrati 0 redova → nema orphan zapisa, sigurno nastaviti.
-- Ako vrati redove   → javi listu, ne nastavljaj dok se orphani ne riješe.

DROP PROCEDURE IF EXISTS migrate_002_attachment_cascade;

DELIMITER $$

CREATE PROCEDURE migrate_002_attachment_cascade()
BEGIN
  DECLARE orphan_count   INT DEFAULT 0;
  DECLARE cascade_ok     INT DEFAULT 0;

  -- 1. Provjeri orphan zapise
  SELECT COUNT(*) INTO orphan_count
  FROM Attachment a
  LEFT JOIN PurchaseRequest pr ON a.fk_purchase_request = pr.id_purchase_request
  WHERE pr.id_purchase_request IS NULL;

  IF orphan_count > 0 THEN
    -- Prikaži koji su orphani
    SELECT
      a.id_attachment,
      a.fk_purchase_request AS request_id_ne_postoji,
      a.file_name,
      a.uploaded_at
    FROM Attachment a
    LEFT JOIN PurchaseRequest pr ON a.fk_purchase_request = pr.id_purchase_request
    WHERE pr.id_purchase_request IS NULL
    ORDER BY a.id_attachment;

    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'MIGRACIJA PREKINUTA: Pronađeni su Attachment zapisi bez odgovarajućeg PurchaseRequest (orphan redovi). Riješite orphane i ponovite migraciju.';
  END IF;

  -- 2. Provjeri je li FK constraint već postavljen s CASCADE
  SELECT COUNT(*) INTO cascade_ok
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA        = DATABASE()
    AND CONSTRAINT_NAME          = 'fk_attachment_request'
    AND DELETE_RULE              = 'CASCADE';

  IF cascade_ok > 0 THEN
    SELECT 'OK: fk_attachment_request već ima ON DELETE CASCADE — nije potrebna izmjena.' AS status;
  ELSE
    -- 3. Constraint postoji ali bez CASCADE → drop + re-add
    ALTER TABLE Attachment
      DROP FOREIGN KEY `fk_attachment_request`;

    ALTER TABLE Attachment
      ADD CONSTRAINT `fk_attachment_request`
        FOREIGN KEY (`fk_purchase_request`)
        REFERENCES `PurchaseRequest` (`id_purchase_request`)
        ON DELETE CASCADE ON UPDATE CASCADE;

    SELECT 'OK: fk_attachment_request ažuriran na ON DELETE CASCADE.' AS status;
  END IF;

  -- 3. Finalni izvještaj
  SELECT
    orphan_count  AS orphan_zapisi_pronadjeni,
    cascade_ok    AS cascade_bio_postavljen;
END$$

DELIMITER ;

CALL migrate_002_attachment_cascade();

DROP PROCEDURE IF EXISTS migrate_002_attachment_cascade;
