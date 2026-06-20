-- ============================================================
-- Migration 001: UNIQUE constraint na Department (fk_fiscal_year, name)
--
-- Pokretanje:
--   mysql -u veleri -p XP < db/migrations/001_department_unique_name_per_year.sql
--
-- VAŽNO: Pokreni prvo SELECT za duplikate ručno i potvrdi 0 redova
--         prije pokretanja cijele migracije.
-- ============================================================

-- Dijagnostički upit — pokreni PRVO ručno:
--
--   SELECT fk_fiscal_year, name, COUNT(*) AS cnt
--   FROM Department
--   GROUP BY fk_fiscal_year, name
--   HAVING cnt > 1;
--
-- Ako vrati 0 redova → sigurno pokrenuti migraciju.
-- Ako vrati redove   → javi listu, ne nastavljaj dok se duplikati ne riješe.

DROP PROCEDURE IF EXISTS migrate_001_department_unique;

DELIMITER $$

CREATE PROCEDURE migrate_001_department_unique()
BEGIN
  DECLARE dup_count INT DEFAULT 0;
  DECLARE constraint_exists INT DEFAULT 0;

  -- 1. Provjeri duplikate
  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT fk_fiscal_year, name
    FROM Department
    GROUP BY fk_fiscal_year, name
    HAVING COUNT(*) > 1
  ) AS dups;

  IF dup_count > 0 THEN
    -- Prikaži koji su duplikati
    SELECT
      fk_fiscal_year,
      name,
      COUNT(*) AS broj_duplikata
    FROM Department
    GROUP BY fk_fiscal_year, name
    HAVING COUNT(*) > 1
    ORDER BY fk_fiscal_year, name;

    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'MIGRACIJA PREKINUTA: Pronađeni su duplikati naziva odjela unutar iste poslovne godine. Riješite duplikate i ponovite migraciju.';
  END IF;

  -- 2. Provjeri nije li constraint već dodan (idempotentnost)
  SELECT COUNT(*) INTO constraint_exists
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'Department'
    AND INDEX_NAME   = 'uq_department_year_name';

  IF constraint_exists > 0 THEN
    SELECT 'INFO: UNIQUE constraint uq_department_year_name već postoji — preskačem.' AS status;
  ELSE
    -- 3. Dodaj constraint
    ALTER TABLE Department
      ADD UNIQUE KEY `uq_department_year_name` (`fk_fiscal_year`, `name`);

    SELECT 'OK: UNIQUE constraint uq_department_year_name uspješno dodan.' AS status;
  END IF;
END$$

DELIMITER ;

CALL migrate_001_department_unique();

DROP PROCEDURE IF EXISTS migrate_001_department_unique;
