CREATE DATABASE IF NOT EXISTS veleriXP
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE veleriXP;

CREATE TABLE uloga (
    id_uloga INT AUTO_INCREMENT PRIMARY KEY,
    naziv VARCHAR(50) NOT NULL UNIQUE,
    opis VARCHAR(255) NULL
);

CREATE TABLE korisnik (
    id_korisnik INT AUTO_INCREMENT PRIMARY KEY,
    fk_uloga INT NOT NULL,
    ime VARCHAR(100) NOT NULL,
    prezime VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    lozinka_hash VARCHAR(255) NOT NULL,
    datum_registracije DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_korisnik_uloga
        FOREIGN KEY (fk_uloga)
        REFERENCES uloga(id_uloga)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE poslovna_godina (
    id_poslovna_godina INT AUTO_INCREMENT PRIMARY KEY,
    godina INT NOT NULL UNIQUE,
    zakljucana BOOLEAN NOT NULL DEFAULT FALSE,
    datum_otvaranja DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE predmet_nabave (
    id_predmet_nabave INT AUTO_INCREMENT PRIMARY KEY,
    fk_poslovna_godina INT NOT NULL,
    naziv VARCHAR(150) NOT NULL,
    opis VARCHAR(255) NULL,
    aktivan BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_predmet_nabave UNIQUE (fk_poslovna_godina, naziv),
    CONSTRAINT fk_predmet_nabave_poslovna_godina
        FOREIGN KEY (fk_poslovna_godina)
        REFERENCES poslovna_godina(id_poslovna_godina)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE mjesto_troska (
    id_mjesto_troska INT AUTO_INCREMENT PRIMARY KEY,
    fk_poslovna_godina INT NOT NULL,
    naziv VARCHAR(150) NOT NULL,
    opis VARCHAR(255) NULL,
    aktivno BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_mjesto_troska UNIQUE (fk_poslovna_godina, naziv),
    CONSTRAINT fk_mjesto_troska_poslovna_godina
        FOREIGN KEY (fk_poslovna_godina)
        REFERENCES poslovna_godina(id_poslovna_godina)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE zahtjev (
    id_zahtjev INT AUTO_INCREMENT PRIMARY KEY,
    broj_zahtjeva VARCHAR(50) NOT NULL UNIQUE,
    fk_korisnik INT NOT NULL,
    fk_poslovna_godina INT NOT NULL,
    fk_predmet_nabave INT NOT NULL,
    fk_mjesto_troska INT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    ukupan_iznos DECIMAL(12,2) NULL,
    napomena TEXT NULL,
    datum_kreiranja DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    datum_zadnje_izmjene DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_zahtjev_status
        CHECK (status IN ('draft', 'poslan', 'u_obradi', 'zatvoren', 'storniran')),
    CONSTRAINT chk_zahtjev_iznos
        CHECK (ukupan_iznos IS NULL OR ukupan_iznos >= 0),
    CONSTRAINT fk_zahtjev_korisnik
        FOREIGN KEY (fk_korisnik)
        REFERENCES korisnik(id_korisnik)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_zahtjev_poslovna_godina
        FOREIGN KEY (fk_poslovna_godina)
        REFERENCES poslovna_godina(id_poslovna_godina)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_zahtjev_predmet_nabave
        FOREIGN KEY (fk_predmet_nabave)
        REFERENCES predmet_nabave(id_predmet_nabave)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_zahtjev_mjesto_troska
        FOREIGN KEY (fk_mjesto_troska)
        REFERENCES mjesto_troska(id_mjesto_troska)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE stavka_zahtjeva (
    id_stavka_zahtjeva INT AUTO_INCREMENT PRIMARY KEY,
    fk_zahtjev INT NOT NULL,
    redni_broj INT NOT NULL,
    naziv_stavke VARCHAR(255) NOT NULL,
    kolicina DECIMAL(12,2) NOT NULL,
    CONSTRAINT uq_stavka_zahtjeva UNIQUE (fk_zahtjev, redni_broj),
    CONSTRAINT chk_stavka_kolicina
        CHECK (kolicina > 0),
    CONSTRAINT fk_stavka_zahtjeva_zahtjev
        FOREIGN KEY (fk_zahtjev)
        REFERENCES zahtjev(id_zahtjev)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE dokument (
    id_dokument INT AUTO_INCREMENT PRIMARY KEY,
    fk_zahtjev INT NOT NULL,
    fk_korisnik INT NOT NULL,
    vrsta_dokumenta VARCHAR(30) NOT NULL,
    naziv_datoteke VARCHAR(255) NOT NULL,
    putanja VARCHAR(500) NOT NULL,
    datum_dodavanja DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_vrsta_dokumenta
        CHECK (vrsta_dokumenta IN ('ponuda', 'otpremnica', 'narudzbenica')),
    CONSTRAINT fk_dokument_zahtjev
        FOREIGN KEY (fk_zahtjev)
        REFERENCES zahtjev(id_zahtjev)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_dokument_korisnik
        FOREIGN KEY (fk_korisnik)
        REFERENCES korisnik(id_korisnik)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE limit_predmeta (
    id_limit_predmeta INT AUTO_INCREMENT PRIMARY KEY,
    fk_poslovna_godina INT NOT NULL,
    fk_predmet_nabave INT NOT NULL,
    limit_iznos DECIMAL(12,2) NOT NULL,
    CONSTRAINT uq_limit_predmeta UNIQUE (fk_poslovna_godina, fk_predmet_nabave),
    CONSTRAINT chk_limit_predmeta_iznos
        CHECK (limit_iznos >= 0),
    CONSTRAINT fk_limit_predmeta_poslovna_godina
        FOREIGN KEY (fk_poslovna_godina)
        REFERENCES poslovna_godina(id_poslovna_godina)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_limit_predmeta_predmet_nabave
        FOREIGN KEY (fk_predmet_nabave)
        REFERENCES predmet_nabave(id_predmet_nabave)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE limit_mjesta_troska (
    id_limit_mjesta_troska INT AUTO_INCREMENT PRIMARY KEY,
    fk_poslovna_godina INT NOT NULL,
    fk_mjesto_troska INT NOT NULL,
    limit_iznos DECIMAL(12,2) NOT NULL,
    CONSTRAINT uq_limit_mjesta_troska UNIQUE (fk_poslovna_godina, fk_mjesto_troska),
    CONSTRAINT chk_limit_mjesta_troska_iznos
        CHECK (limit_iznos >= 0),
    CONSTRAINT fk_limit_mjesta_troska_poslovna_godina
        FOREIGN KEY (fk_poslovna_godina)
        REFERENCES poslovna_godina(id_poslovna_godina)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_limit_mjesta_troska_mjesto_troska
        FOREIGN KEY (fk_mjesto_troska)
        REFERENCES mjesto_troska(id_mjesto_troska)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE evidencija_radnji (
    id_evidencija_radnji INT AUTO_INCREMENT PRIMARY KEY,
    fk_korisnik INT NOT NULL,
    fk_zahtjev INT NOT NULL,
    radnja VARCHAR(150) NOT NULL,
    datum_vrijeme DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evidencija_radnji_korisnik
        FOREIGN KEY (fk_korisnik)
        REFERENCES korisnik(id_korisnik)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_evidencija_radnji_zahtjev
        FOREIGN KEY (fk_zahtjev)
        REFERENCES zahtjev(id_zahtjev)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

INSERT INTO uloga (naziv, opis) VALUES
('korisnik', 'Osnovna korisnicka uloga'),
('administrator', 'Administratorska uloga s prosirenim ovlastima');

INSERT INTO poslovna_godina (godina, zakljucana, datum_otvaranja) VALUES
(2026, FALSE, '2026-01-01 00:00:00');

INSERT INTO predmet_nabave (fk_poslovna_godina, naziv, opis, aktivan) VALUES
(1, 'racunalna_oprema', 'Nabava IT opreme', TRUE),
(1, 'uredski_materijal', 'Potrosni uredski materijal', TRUE),
(1, 'klima_uredjaji', 'Nabava klima uredjaja', TRUE);

INSERT INTO mjesto_troska (fk_poslovna_godina, naziv, opis, aktivno) VALUES
(1, 'projekt_xy', 'Interni projekt', TRUE),
(1, 'racunovodstvo', 'Administrativna sluzba', TRUE),
(1, 'studentska_sluzba', 'Podrska studentima', TRUE);

INSERT INTO limit_predmeta (fk_poslovna_godina, fk_predmet_nabave, limit_iznos) VALUES
(1, 1, 10000.00),
(1, 2, 3000.00),
(1, 3, 15000.00);

INSERT INTO limit_mjesta_troska (fk_poslovna_godina, fk_mjesto_troska, limit_iznos) VALUES
(1, 1, 5000.00),
(1, 2, 4000.00),
(1, 3, 8000.00);