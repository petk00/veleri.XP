# Dokumentacija baze podataka

Ovaj dokument opisuje bazu podataka aplikacije `veleri.XP`.
Baza je relacijska i koristi MySQL/MariaDB. Trenutni dump nalazi se u:

```text
database/dump-XP-202605061957.sql
```

Model baze prati osnovni proces zahtjeva za nabavu:

1. korisnik se prijavljuje u sustav,
2. zaposlenik kreira zahtjev za nabavu,
3. zahtjev ima jednu poslovnu godinu, jedno mjesto troška i jedan ili više predmeta nabave,
4. administrator obrađuje zahtjev kroz statuse,
5. dokumenti se vežu uz zahtjev,
6. svaka važna promjena zapisuje se u povijest aktivnosti.

## Tehnologija

| Stavka | Vrijednost |
|---|---|
| Sustav baze | MySQL / MariaDB |
| Naziv baze u lokalnom dumpu | `XP` |
| Charset | `utf8mb4` |
| Collation | `utf8mb4_unicode_ci` |
| Storage engine | InnoDB |
| Primarni ključevi | Auto-increment integer |
| Relacije | Foreign key ograničenja |

## Pregled tablica

| Tablica | Namjena |
|---|---|
| `Role` | Korisničke uloge. |
| `AppUser` | Korisnici aplikacije. |
| `FiscalYear` | Poslovne godine. |
| `Department` | Mjesta troška / odjeli po poslovnoj godini. |
| `ItemCategory` | Predmeti nabave / kategorije po poslovnoj godini. |
| `RequestStatus` | Statusi zahtjeva. |
| `PurchaseRequest` | Glavni zapis zahtjeva za nabavu. |
| `PurchaseRequestItem` | Stavke zahtjeva. |
| `Attachment` | Dokumenti vezani uz zahtjev. |
| `RequestStatusHistory` | Povijest statusa i aktivnosti nad zahtjevom. |

## Logički model

Glavna tablica sustava je `PurchaseRequest`.
Na nju su vezane stavke, dokumenti i povijest aktivnosti.

```text
Role 1 ── * AppUser

FiscalYear 1 ── * Department
FiscalYear 1 ── * ItemCategory
FiscalYear 1 ── * PurchaseRequest

Department 1 ── * PurchaseRequest
RequestStatus 1 ── * PurchaseRequest
AppUser 1 ── * PurchaseRequest

PurchaseRequest 1 ── * PurchaseRequestItem
ItemCategory 1 ── * PurchaseRequestItem

PurchaseRequest 1 ── * Attachment
AppUser 1 ── * Attachment

PurchaseRequest 1 ── * RequestStatusHistory
RequestStatus 1 ── * RequestStatusHistory
AppUser 1 ── * RequestStatusHistory
```

## Tablica `Role`

Tablica definira korisničke uloge.

| Stupac | Tip | Ograničenje | Opis |
|---|---|---|---|
| `id_role` | `int` | PK, AI | Jedinstveni identifikator uloge. |
| `name` | `varchar(100)` | NOT NULL, UNIQUE | Naziv uloge. |

Trenutno korištene uloge:

| ID | Naziv |
|---:|---|
| 1 | `Administrator` |
| 2 | `Zaposlenik` |

U aplikaciji se uloge koriste za kontrolu pristupa:

- administrator vidi sve zahtjeve i može mijenjati statuse,
- zaposlenik vidi vlastite zahtjeve i može uređivati zahtjev kada je vraćen na izmjenu.

## Tablica `AppUser`

Tablica sadrži korisničke račune.

| Stupac | Tip | Ograničenje | Opis |
|---|---|---|---|
| `id_user` | `int` | PK, AI | Jedinstveni identifikator korisnika. |
| `fk_role` | `int` | FK, NOT NULL | Veza na tablicu `Role`. |
| `first_name` | `varchar(100)` | NOT NULL | Ime korisnika. |
| `last_name` | `varchar(100)` | NOT NULL | Prezime korisnika. |
| `email` | `varchar(150)` | NOT NULL, UNIQUE | Email adresa za prijavu. |
| `password_hash` | `varchar(255)` | NOT NULL | Hash lozinke. |
| `is_active` | `tinyint(1)` | NOT NULL, default `1` | Oznaka aktivnog korisnika. |

Relacije:

- `fk_role` -> `Role.id_role`

Pravila u aplikaciji:

- prijava se radi preko `email` i lozinke,
- lozinka se ne sprema u izvornom obliku, nego kao hash,
- neaktivan korisnik (`is_active = 0`) ne može se prijaviti,
- email mora biti jedinstven.

Napomena: administracija korisnika kroz UI/API još nije implementirana. Tablica podržava aktivaciju/deaktivaciju korisnika, ali trenutno se korisnici ne održavaju kroz posebnu admin stranicu.

## Tablica `FiscalYear`

Tablica predstavlja poslovne godine.

| Stupac | Tip | Ograničenje | Opis |
|---|---|---|---|
| `id_fiscal_year` | `int` | PK, AI | Jedinstveni identifikator poslovne godine. |
| `year` | `int` | NOT NULL, UNIQUE | Godina, npr. `2026`. |
| `is_closed` | `tinyint(1)` | NOT NULL, default `0` | Oznaka zaključane godine. |
| `total_budget` | `decimal(14,2)` | NOT NULL, default `0.00` | Ukupni godišnji budžet za nabavu. |

> **Migracija za postojeće baze:**
> ```sql
> ALTER TABLE `FiscalYear`
>   ADD COLUMN `total_budget` decimal(14,2) NOT NULL DEFAULT '0.00';
> ```

Pravila u aplikaciji:

- aktivna poslovna godina dohvaća se kao zadnja godina gdje je `is_closed = 0`,
- zahtjev se veže na poslovnu godinu preko `PurchaseRequest.fk_fiscal_year`,
- `total_budget` definira se pri kreiranju nove godine i predstavlja gornji limit koji se može rasporediti po odjelima,
- suma `department_limit` svih odjela jedne godine ne smije premašiti `total_budget` — backend odbija unos koji prelazi limit.

## Tablica `Department`

Tablica predstavlja mjesta troška, odjele, službe ili projekte.
Zapisi su vezani uz poslovnu godinu.

| Stupac | Tip | Ograničenje | Opis |
|---|---|---|---|
| `id_department` | `int` | PK, AI | Jedinstveni identifikator odjela. |
| `fk_fiscal_year` | `int` | FK, NOT NULL | Poslovna godina kojoj odjel pripada. |
| `name` | `varchar(150)` | NOT NULL, UNIQUE po godini | Naziv mjesta troška / odjela — jedinstven unutar poslovne godine (`uq_dept_name_per_year`). |
| `department_limit` | `decimal(14,2)` | NOT NULL | Godišnji limit za mjesto troška. |
| `is_active` | `tinyint(1)` | NOT NULL, default `1` | Oznaka aktivnog zapisa. |

Relacije:

- `fk_fiscal_year` -> `FiscalYear.id_fiscal_year`

Pravila u aplikaciji:

- kod kreiranja zahtjeva korisnik bira aktivan odjel,
- referentna ruta vraća samo zapise gdje je `is_active = 1`,
- `department_limit` definira koliki udio godišnjeg budžeta (`FiscalYear.total_budget`) je dodijeljen odjelu,
- suma svih `department_limit` u godini ne smije premašiti `FiscalYear.total_budget` — backend provjerava pri svakom dodavanju i izmjeni odjela,
- limit se može mijenjati dok je godina otvorena.

## Tablica `ItemCategory`

Tablica predstavlja predmete nabave ili kategorije stavki.
Kao i odjeli, zapisi su vezani uz poslovnu godinu.

| Stupac | Tip | Ograničenje | Opis |
|---|---|---|---|
| `id_item_category` | `int` | PK, AI | Jedinstveni identifikator kategorije. |
| `fk_fiscal_year` | `int` | FK, NOT NULL | Poslovna godina kojoj kategorija pripada. |
| `name` | `varchar(150)` | NOT NULL, UNIQUE po godini | Naziv predmeta nabave / kategorije — jedinstven unutar poslovne godine (`uq_cat_name_per_year`). |
| `category_limit` | `decimal(14,2)` | NOT NULL | Godišnji limit za kategoriju. |
| `is_active` | `tinyint(1)` | NOT NULL, default `1` | Oznaka aktivnog zapisa. |

Relacije:

- `fk_fiscal_year` -> `FiscalYear.id_fiscal_year`

Pravila u aplikaciji:

- kod kreiranja stavke korisnik bira aktivnu kategoriju,
- referentna ruta vraća samo zapise gdje je `is_active = 1`,
- `category_limit` definira informativni limit za kategoriju — prikazuje se u admin sučelju, ali trenutno ne blokira zahtjeve koji ga premašuju.

## Tablica `RequestStatus`

Tablica sadrži statuse zahtjeva.

| Stupac | Tip | Ograničenje | Opis |
|---|---|---|---|
| `id_request_status` | `int` | PK, AI | Jedinstveni identifikator statusa. |
| `name` | `varchar(100)` | NOT NULL, UNIQUE | Naziv statusa. |

Statusi u bazi:

| ID | Naziv |
|---:|---|
| 1 | `Poslano` |
| 2 | `Na odobrenju` |
| 3 | `Vraćeno na dopunu / izmjenu` |
| 4 | `Odobreno` |
| 5 | `Odbijeno` |
| 6 | `Naručeno` |
| 7 | `Zatvoreno` |

Trenutna implementacija koristi sljedeći workflow:

```text
Poslano
  -> Na odobrenju
  -> Odbijeno

Na odobrenju
  -> Naručeno
  -> Vraćeno na dopunu/izmjenu

Vraćeno na dopunu/izmjenu
  -> Poslano

Naručeno
  -> Zatvoreno
```

Napomena: status `Odobreno` postoji u bazi, ali ga trenutni backend workflow ne koristi kao završni operativni status. U aktualnom kodu odobren zahtjev prelazi u `Naručeno`.

## Tablica `PurchaseRequest`

Tablica predstavlja glavni zapis zahtjeva za nabavu.

| Stupac | Tip | Ograničenje | Opis |
|---|---|---|---|
| `id_purchase_request` | `int` | PK, AI | Jedinstveni identifikator zahtjeva. |
| `request_number` | `varchar(50)` | NOT NULL, UNIQUE | Automatski generirani broj zahtjeva. |
| `fk_fiscal_year` | `int` | FK, NOT NULL | Poslovna godina zahtjeva. |
| `fk_department` | `int` | FK, NOT NULL | Mjesto troška / odjel. |
| `fk_request_status` | `int` | FK, NOT NULL | Trenutni status zahtjeva. |
| `fk_created_by_user` | `int` | FK, NOT NULL | Korisnik koji je kreirao zahtjev. |
| `total_amount` | `decimal(14,2)` | NULL | Procijenjeni iznos zahtjeva. |
| `justification` | `text` | NULL | Obrazloženje nabave. |
| `created_at` | `timestamp` | NOT NULL, default CURRENT_TIMESTAMP | Datum i vrijeme kreiranja. |
| `updated_at` | `timestamp` | NULL | Datum i vrijeme zadnje izmjene. |

Relacije:

- `fk_fiscal_year` -> `FiscalYear.id_fiscal_year`
- `fk_department` -> `Department.id_department`
- `fk_request_status` -> `RequestStatus.id_request_status`
- `fk_created_by_user` -> `AppUser.id_user`

Pravila u aplikaciji:

- broj zahtjeva generira se u formatu `PR-GGGG-XXXX`, npr. `PR-2026-0001`,
- novi zahtjev dobiva status `Poslano`,
- zahtjev mora imati poslovnu godinu, odjel, obrazloženje i barem jednu stavku,
- obrazloženje je ograničeno na 1000 znakova u backend validaciji,
- procijenjeni iznos mora biti pozitivan broj ako je unesen,
- zaposlenik može vidjeti samo vlastite zahtjeve,
- administrator može vidjeti sve zahtjeve,
- statusi `Odbijeno` i `Zatvoreno` zaključavaju zahtjev za daljnje izmjene.

## Tablica `PurchaseRequestItem`

Tablica sadrži stavke zahtjeva.
Jedan zahtjev može imati više stavki.

| Stupac | Tip | Ograničenje | Opis |
|---|---|---|---|
| `id_purchase_request_item` | `int` | PK, AI | Jedinstveni identifikator stavke. |
| `fk_purchase_request` | `int` | FK, NOT NULL | Zahtjev kojem stavka pripada. |
| `fk_item_category` | `int` | FK, NOT NULL | Predmet nabave / kategorija. |
| `item_name` | `varchar(200)` | NOT NULL | Naziv stavke. |
| `quantity` | `int` | NOT NULL, default `1` | Količina. |

Relacije:

- `fk_purchase_request` -> `PurchaseRequest.id_purchase_request`
- `fk_item_category` -> `ItemCategory.id_item_category`

Pravila u aplikaciji:

- zahtjev mora imati barem jednu stavku,
- svaka stavka mora imati kategoriju, naziv i količinu,
- količina mora biti cijeli broj veći od 0,
- kod uređivanja zahtjeva postojeće stavke se brišu i ponovno upisuju prema poslanim podacima.

Brisanje:

- ako se obriše `PurchaseRequest`, njegove stavke se brišu automatski zbog `ON DELETE CASCADE`.

## Tablica `Attachment`

Tablica sadrži metapodatke dokumenata vezanih uz zahtjev.
Sama datoteka sprema se na filesystem, a baza čuva putanju i opis.

| Stupac | Tip | Ograničenje | Opis |
|---|---|---|---|
| `id_attachment` | `int` | PK, AI | Jedinstveni identifikator dokumenta. |
| `fk_purchase_request` | `int` | FK, NOT NULL | Zahtjev kojem dokument pripada. |
| `fk_uploaded_by_user` | `int` | FK, NOT NULL | Korisnik koji je uploadavao dokument. |
| `file_name` | `varchar(255)` | NOT NULL | Izvorni naziv datoteke. |
| `file_path` | `varchar(500)` | NOT NULL | Putanja datoteke na serveru. |
| `file_type` | `varchar(100)` | NULL | MIME tip datoteke. |
| `document_type` | `varchar(100)` | NOT NULL | Poslovni tip dokumenta. |
| `uploaded_at` | `timestamp` | NOT NULL, default CURRENT_TIMESTAMP | Datum i vrijeme uploada. |

Relacije:

- `fk_purchase_request` -> `PurchaseRequest.id_purchase_request`
- `fk_uploaded_by_user` -> `AppUser.id_user`

Trenutno podržani tipovi dokumenata:

| Tip | Kada se može dodati |
|---|---|
| `Ponuda` | Dok je zahtjev u statusu `Poslano`, `Na odobrenju` ili `Vraćeno na dopunu/izmjenu`. |
| `Otpremnica` | Dok je zahtjev u statusu `Naručeno`. |

Dozvoljeni MIME tipovi u trenutnoj implementaciji:

| Vrsta | MIME tipovi |
|---|---|
| PDF | `application/pdf` |
| Word | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX) |
| Excel | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (XLSX) |
| Slike | `image/jpeg`, `image/png` |
| Arhiva | `application/zip` |

Stari DOC/XLS i TXT formati nisu podržani jer backend uz MIME whitelist verificira i magic bytes datoteke (`file-type`), a ti formati nemaju pouzdan binarni potpis.

Ograničenje veličine datoteke:

```text
10 MB
```

Putanja spremanja:

```text
server/uploads/attachments/{id_purchase_request}/
```

Pravila u aplikaciji:

- dokument se može dodati samo ako korisnik ima pristup zahtjevu,
- zaposlenik može dodavati dokumente samo na vlastite zahtjeve,
- dokumenti se ne mogu dodavati ni brisati ako je zahtjev u statusu `Odbijeno` ili `Zatvoreno`,
- kod dodavanja ili brisanja dokumenta upisuje se zapis u `RequestStatusHistory`,
- download dokumenta provjerava pristup korisnika prije slanja datoteke.

Brisanje:

- metapodatak se briše iz tablice `Attachment`,
- backend zatim pokušava obrisati fizičku datoteku s diska,
- ako se obriše `PurchaseRequest`, njegovi dokumenti se brišu iz baze zbog `ON DELETE CASCADE`, ali fizičke datoteke na disku ovise o aplikacijskoj logici.

## Tablica `RequestStatusHistory`

Tablica predstavlja audit trail zahtjeva.
U nju se zapisuju promjene statusa i druge bitne aktivnosti.

| Stupac | Tip | Ograničenje | Opis |
|---|---|---|---|
| `id_request_status_history` | `int` | PK, AI | Jedinstveni identifikator zapisa povijesti. |
| `fk_purchase_request` | `int` | FK, NOT NULL | Zahtjev na koji se zapis odnosi. |
| `fk_request_status` | `int` | FK, NOT NULL | Status zahtjeva u trenutku zapisa. |
| `fk_changed_by_user` | `int` | FK, NOT NULL | Korisnik koji je napravio radnju. |
| `changed_at` | `timestamp` | NOT NULL, default CURRENT_TIMESTAMP | Datum i vrijeme radnje. |
| `comment` | `text` | NULL | Komentar ili opis radnje. |

Relacije:

- `fk_purchase_request` -> `PurchaseRequest.id_purchase_request`
- `fk_request_status` -> `RequestStatus.id_request_status`
- `fk_changed_by_user` -> `AppUser.id_user`

Tipični zapisi:

- zahtjev kreiran i poslan,
- zahtjev preuzet na obradu,
- zahtjev odobren,
- zahtjev odbijen,
- zahtjev vraćen na izmjenu,
- zahtjev ponovno poslan,
- zahtjev označen kao završen,
- dokument dodan,
- dokument obrisan,
- zahtjev izmijenjen.

Brisanje:

- ako se obriše `PurchaseRequest`, povijest se briše automatski zbog `ON DELETE CASCADE`.

## Relacijski integritet

Baza koristi foreign key ograničenja za očuvanje povezanosti podataka.

| Veza | Pravilo brisanja | Objašnjenje |
|---|---|---|
| `AppUser.fk_role` -> `Role.id_role` | RESTRICT | Uloga se ne može obrisati ako je koriste korisnici. |
| `Department.fk_fiscal_year` -> `FiscalYear.id_fiscal_year` | RESTRICT | Godina se ne može obrisati ako ima odjele. |
| `ItemCategory.fk_fiscal_year` -> `FiscalYear.id_fiscal_year` | RESTRICT | Godina se ne može obrisati ako ima kategorije. |
| `PurchaseRequest.fk_fiscal_year` -> `FiscalYear.id_fiscal_year` | RESTRICT | Godina se ne može obrisati ako ima zahtjeve. |
| `PurchaseRequest.fk_department` -> `Department.id_department` | RESTRICT | Odjel se ne može obrisati ako je korišten u zahtjevu. |
| `PurchaseRequest.fk_request_status` -> `RequestStatus.id_request_status` | RESTRICT | Status se ne može obrisati ako je korišten u zahtjevu. |
| `PurchaseRequest.fk_created_by_user` -> `AppUser.id_user` | RESTRICT | Korisnik se ne može obrisati ako ima zahtjeve. |
| `PurchaseRequestItem.fk_purchase_request` -> `PurchaseRequest.id_purchase_request` | CASCADE | Stavke se brišu zajedno sa zahtjevom. |
| `Attachment.fk_purchase_request` -> `PurchaseRequest.id_purchase_request` | CASCADE | Dokumenti se brišu zajedno sa zahtjevom u bazi. |
| `RequestStatusHistory.fk_purchase_request` -> `PurchaseRequest.id_purchase_request` | CASCADE | Povijest se briše zajedno sa zahtjevom. |

## Poslovna pravila povezana s bazom

### Generiranje broja zahtjeva

Broj zahtjeva generira backend prema poslovnoj godini:

```text
PR-GGGG-XXXX
```

Primjer:

```text
PR-2026-0001
```

Backend traži zadnji postojeći broj za odabranu godinu i povećava redni broj.
Polje `request_number` ima UNIQUE ograničenje, pa baza dodatno štiti od duplikata.

### Aktivni šifrarnici

Kod dohvaćanja odjela i kategorija backend trenutno vraća samo zapise s:

```sql
is_active = 1
```

To omogućuje deaktivaciju šifrarnika bez brisanja povijesnih podataka.

### Zaključani zahtjevi

Zahtjevi u statusima:

- `Odbijeno` (`5`),
- `Zatvoreno` (`7`)

smatraju se zaključanima.
Nad njima se ne dopuštaju izmjene zahtjeva ni dodavanje/brisanje dokumenata.

### Audit trail

Svaka važna akcija nad zahtjevom treba imati zapis u `RequestStatusHistory`.
Frontend taj zapis prikazuje kao povijest aktivnosti na detalju zahtjeva.

## Trenutno implementirano

U trenutnoj verziji aplikacije baza podržava i backend koristi:

- prijavu korisnika preko `AppUser` i `Role`,
- dohvat aktivne poslovne godine,
- dohvat aktivnih odjela i kategorija,
- kreiranje zahtjeva,
- automatsko generiranje broja zahtjeva,
- kreiranje stavki zahtjeva,
- promjene statusa zahtjeva,
- upload, pregled, download i brisanje dokumenata,
- povijest aktivnosti zahtjeva,
- admin CRUD korisnika (aktivacija, deaktivacija, invite link, reset lozinke),
- admin upravljanje poslovnim godinama (otvaranje, zaključavanje),
- automatsko kopiranje odjela i kategorija u novu poslovnu godinu,
- admin CRUD odjela i kategorija po poslovnoj godini,
- godišnji budžet (`FiscalYear.total_budget`) s raspodjelom po odjelima (`department_limit`),
- backend validacija: suma `department_limit` odjela ne smije premašiti `total_budget`.

## Djelomično ili nije implementirano

| Cjelina | Stanje |
|---|---|
| Provjera limita kategorija u workflowu | `category_limit` prikazuje se u UI, ali ne blokira zahtjeve. |
| Storniranje zahtjeva | Implementirano kroz akciju `storno`; status `Odbijeno` koristi se i za stornirane zahtjeve. |
| Tipovi dokumenata | Podržani su `Ponuda` i `Otpremnica`; ostali tipovi izvan su opsega projekta. |

## Napomene za daljnji razvoj

- razmotriti blokiranje zahtjeva koji premašuju `department_limit` odjela,
- razmotriti provjeru `category_limit` u workflowu,
- razmotriti zasebnu tablicu za tipove dokumenata ako se broj tipova poveća.
