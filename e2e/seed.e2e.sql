-- ============================================================
-- Testni podaci za e2e testove.
-- Koristi se SAMO u CI-ju (nakon db/01_schema.sql i db/02_seed.sql) —
-- produkcijski seed namjerno ne sadrži poslovnu godinu jer je admin
-- kreira kroz aplikaciju (stranica Financije).
-- Wizard novog zahtjeva zahtijeva aktivnu poslovnu godinu s barem
-- jednim odjelom i jednom kategorijom.
-- ============================================================

INSERT INTO `FiscalYear` (`id_fiscal_year`, `year`, `is_closed`, `total_budget`) VALUES
(1, 2026, 0, 100000.00);

INSERT INTO `Department` (`fk_fiscal_year`, `name`, `department_limit`, `is_active`) VALUES
(1, 'Odjel informatike', 20000.00, 1),
(1, 'Ured ravnatelja', 10000.00, 1);

INSERT INTO `ItemCategory` (`fk_fiscal_year`, `name`, `category_limit`, `is_active`) VALUES
(1, 'Računalna oprema', 15000.00, 1),
(1, 'Uredski materijal', 5000.00, 1);
