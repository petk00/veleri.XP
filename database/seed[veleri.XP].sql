-- ============================================================
-- seed.sql — Inicijalni obvezni podaci
-- Sustav za upravljanje zahtjevima za nabavu (Veleučilište u Rijeci)
--
-- Sadrži minimalni skup podataka bez kojeg sustav ne može raditi:
-- šifrarnike (Role, RequestStatus, FiscalYear, Department, ItemCategory)
-- i inicijalne korisničke račune.
-- ============================================================

SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- Role
-- ------------------------------------------------------------
INSERT INTO `Role` (`id_role`, `name`) VALUES
(1, 'Administrator'),
(2, 'Zaposlenik');

-- ------------------------------------------------------------
-- RequestStatus — svih 7 statusa workflow-a (obavezno)
-- ------------------------------------------------------------
INSERT INTO `RequestStatus` (`id_request_status`, `name`) VALUES
(1, 'Poslano'),
(2, 'Na odobrenju'),
(3, 'Zahtjeva izmjene'),
(4, 'Odobreno'),
(5, 'Odbijeno'),
(6, 'Naručeno'),
(7, 'Zatvoreno');

-- ------------------------------------------------------------
-- FiscalYear — inicijalna poslovna godina
-- ------------------------------------------------------------
INSERT INTO `FiscalYear` (`id_fiscal_year`, `year`, `is_closed`) VALUES
(1, 2026, 0);

-- ------------------------------------------------------------
-- Department — inicijalni odjeli za 2026.
-- ------------------------------------------------------------
INSERT INTO `Department` (`id_department`, `fk_fiscal_year`, `name`, `department_limit`, `is_active`) VALUES
(1, 1, 'IT', 25000.00, 1),
(2, 1, 'Nabava', 15000.00, 1),
(3, 1, 'Računovodstvo', 12000.00, 1),
(4, 1, 'Odjel za informacijske i komunikacijske tehnologije', 10000.00, 1),
(5, 1, 'Ekonomat', 2000.00, 1),
(6, 1, 'Referada', 0.00, 1);

-- ------------------------------------------------------------
-- ItemCategory — inicijalne kategorije za 2026.
-- ------------------------------------------------------------
INSERT INTO `ItemCategory` (`id_item_category`, `fk_fiscal_year`, `name`, `category_limit`, `is_active`) VALUES
(1, 1, 'Računalna oprema', 20000.00, 1),
(2, 1, 'Softver', 15000.00, 1),
(3, 1, 'Uredski materijal', 5000.00, 1),
(4, 1, 'Namještaj', 10000.00, 1),
(5, 1, 'Uredski papir A4 [500 kom]', 0.00, 1);

-- ------------------------------------------------------------
-- AppUser — 2 inicijalna korisnika
-- Lozinke su bcrypt hashevi — korisnici ih postavljaju
-- putem invite linka pri prvom pristupu.
-- admin@veleri.hr     → uloga: Administrator
-- zaposlenik@veleri.hr → uloga: Zaposlenik
-- ------------------------------------------------------------
INSERT INTO `AppUser` (`id_user`, `fk_role`, `first_name`, `last_name`, `email`, `password_hash`, `is_active`, `invite_token`, `invite_token_expires`) VALUES
(1, 1, 'Admin', 'Korisnik', 'admin@veleri.hr', '$2b$10$LwdoCm.pIlh1/hz5xH.NluYORW0qKrb7UC7ULHZFrRz2Yv4JIMDGC', 1, NULL, NULL),
(2, 2, 'Zaposlenik', 'Korisnik', 'zaposlenik@veleri.hr', '$2b$10$c1sci8OhP4.UnhmuY/1nh.ri3NWIEKsHrfzsZzuAQcTDY76KfJLZS', 1, NULL, NULL);

-- ============================================================
-- Kraj seed.sql
-- ============================================================
