USE veleriXP;

INSERT INTO uloga (naziv, opis) VALUES
('korisnik', 'Osnovna korisnička uloga'),
('administrator', 'Administratorska uloga');

INSERT INTO poslovna_godina (godina, zakljucana, datum_otvaranja) VALUES
(2026, 0, NOW());

INSERT INTO status_zahtjeva (naziv, opis, redoslijed, aktivan) VALUES
('draft', 'Početni status zahtjeva', 1, 1),
('poslan', 'Zahtjev je poslan u obradu', 2, 1),
('u_obradi', 'Zahtjev je u obradi', 3, 1),
('zatvoren', 'Zahtjev je zatvoren', 4, 1),
('storniran', 'Zahtjev je storniran', 5, 1);

INSERT INTO vrsta_dokumenta (naziv, opis, aktivan) VALUES
('ponuda', 'Dokument ponude dobavljača', 1),
('otpremnica', 'Dokument otpremnice', 1),
('narudzbenica', 'Dokument narudžbenice', 1),
('ostalo', 'Ostala dokumentacija', 1);

INSERT INTO korisnik (
    fk_uloga,
    ime,
    prezime,
    email,
    lozinka_hash,
    datum_registracije,
    aktivan
) VALUES (
    (SELECT id_uloga FROM uloga WHERE naziv = 'administrator'),
    'Admin',
    'Sustav',
    'admin@velerixp.hr',
    '$2y$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMN0123456789abcd',
    NOW(),
    1
);

INSERT INTO predmet_nabave (
    fk_poslovna_godina,
    naziv,
    opis,
    aktivan
) VALUES
((SELECT id_poslovna_godina FROM poslovna_godina WHERE godina = 2026), 'IT oprema', 'Računalna i informatička oprema', 1),
((SELECT id_poslovna_godina FROM poslovna_godina WHERE godina = 2026), 'Uredski materijal', 'Potrošni uredski materijal', 1),
((SELECT id_poslovna_godina FROM poslovna_godina WHERE godina = 2026), 'Servisne usluge', 'Usluge održavanja i servisa', 1);

INSERT INTO mjesto_troska (
    fk_poslovna_godina,
    naziv,
    opis,
    aktivan
) VALUES
((SELECT id_poslovna_godina FROM poslovna_godina WHERE godina = 2026), 'Projekt A', 'Mjesto troška za projekt A', 1),
((SELECT id_poslovna_godina FROM poslovna_godina WHERE godina = 2026), 'Uprava', 'Mjesto troška uprave', 1),
((SELECT id_poslovna_godina FROM poslovna_godina WHERE godina = 2026), 'Nastava', 'Mjesto troška nastavnih aktivnosti', 1);