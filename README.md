# veleri.XP

> Aplikacija za upravljanje zahtjevima za nabavu na Veleucilistu u Rijeci.

veleri.XP je full-stack MVP aplikacija za digitalizaciju procesa nabave: zaposlenik kreira zahtjev, administrator ga preuzima, odobrava ili vraca na izmjenu, a zahtjev se zatvara nakon potrebne dokumentacije.

## TODO

Napravljeno je:

prijava
osnovne role i role-based pristup
kreiranje zahtjeva
automatski broj zahtjeva
odabir aktivne poslovne godine
odabir odjela/mjesta troška
odabir kategorije/predmeta nabave
unos stavki i količina
lista, detalji, uređivanje zahtjeva
workflow statusa
upload/download/brisanje dokumenata
audit trail/povijest aktivnosti


Nije ili je samo djelomično:

registracija korisnika
admin upravljanje korisnicima i ulogama
otvaranje nove poslovne godine
kopiranje šifrarnika u novu godinu
uređivanje šifrarnika kroz aplikaciju
zaključavanje prethodne godine kroz aplikaciju
pregled/filtriranje prethodnih godina kao posebna funkcionalnost
stvarna validacija godišnjih limita
eksplicitna zabrana brisanja poslovne godine, jer CRUD poslovnih godina uopće ne postoji

## Status projekta

**Verzija:** 0.2  
**Faza:** MVP u razvoju / demo sprint

Trenutno je implementiran end-to-end tijek: prijava korisnika, kreiranje zahtjeva, pregled liste, detalji zahtjeva, promjena statusa, upload dokumenata i audit trail.

## Tech Stack

| Sloj | Tehnologija |
|---|---|
| Frontend | Vue 3, Quasar Framework, Composition API |
| Backend | Node.js, Express |
| Baza | MySQL / MariaDB |
| Auth | JWT, bcrypt |
| Upload | Multer |
| API | REST |

## Struktura projekta

```text
veleri.XP/
├── client/          # Vue 3 + Quasar frontend
│   └── src/
│       ├── pages/   # Stranice aplikacije
│       ├── router/  # Routing
│       ├── boot/    # Axios konfiguracija
│       └── stores/  # Pinia stores
├── server/          # Node.js + Express backend
│   └── src/
│       ├── routes/      # API rute
│       ├── middleware/  # Auth middleware
│       └── config/      # DB konfiguracija
├── database/        # SQL dump i modeli baze
├── docs/            # Dokumentacija i dijagrami
└── README.md
```

## Glavne funkcionalnosti

### Autentikacija i role

- Login putem emaila i lozinke.
- Lozinke su hashirane pomocu bcrypta.
- JWT autentikacija.
- Zasticene frontend rute.
- Dvije role: `Administrator` i `Zaposlenik`.
- Zaposlenik vidi svoje zahtjeve.
- Administrator vidi sve zahtjeve i ima akcije obrade.

### Zahtjevi za nabavu

- Kreiranje novog zahtjeva kroz wizard.
- Odabir odjela/sluzbe/projekta.
- Unos obrazlozenja nabave.
- Unos stavki i kolicina.
- Unos procijenjenog iznosa.
- Opcionalni upload ponude prilikom kreiranja.
- Automatsko generiranje broja zahtjeva u formatu `PR-GGGG-XXXX`.

### Pregled i upravljanje

- Lista zahtjeva s pretragom i filtrima.
- Detaljan prikaz zahtjeva.
- Prikaz stavki, iznosa, statusa, kreatora i povijesti aktivnosti.
- Editiranje zahtjeva kada workflow to dopusta.
- Audit trail kroz tablicu `RequestStatusHistory`.

### Dokumenti

- Upload dokumenata tipa `Ponuda` i `Otpremnica`.
- Dozvoljeni su PDF, Word, Excel, slike, TXT i ZIP.
- Limit velicine datoteke: 10 MB.
- Datoteke se spremaju na server filesystem u `server/uploads/attachments/{id}/`.
- Download datoteka iz browsera.
- Brisanje dokumenata prema pravilima role/statusa.

## Workflow zahtjeva

Stvarni workflow u backendu trenutno je:

```text
[Zaposlenik kreira zahtjev]
        |
        v
   [Poslano]
        |
        | admin: preuzmi
        v
 [Na odobrenju]
    |          |
    |          | admin: vrati-na-izmjenu
    |          v
    |     [Vraceno na dopunu/izmjenu]
    |          |
    |          | zaposlenik: resubmit
    |          v
    |      [Poslano]
    |
    | admin: odobri
    v
  [Naruceno]
        |
        | admin: zavrsi
        v
  [Zatvoreno]

Admin moze odbiti zahtjev iz statusa [Poslano].
```

Statusi koji se koriste u kodu:

| ID | Status |
|---:|---|
| 1 | Poslano |
| 2 | Na odobrenju |
| 3 | Vraceno na dopunu/izmjenu |
| 5 | Odbijeno |
| 6 | Naruceno |
| 7 | Zatvoreno |

Napomena: status `Odobreno` postoji u bazi kao stariji status, ali ga trenutni workflow ne koristi kao zavrsni operativni status. U aktualnom kodu odobren zahtjev prelazi u `Naruceno`.

## Lokalno pokretanje

### 1. Kloniranje projekta

```bash
git clone <repo-url>
cd veleri.XP
```

### 2. Baza podataka

Instalirati MySQL ili MariaDB, zatim kreirati bazu:

```sql
CREATE DATABASE XP CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Import postojeceg dumpa:

```bash
mysql -u root -p XP < database/dump-XP-202605061957.sql
```

Ako se projekt prenosi na drugi laptop, kod dolazi s GitHuba, ali baza ne. Bazu treba importati iz SQL dumpa ili napraviti novi dump sa starog laptopa.

### 3. Server konfiguracija

U `server/` napraviti `.env` datoteku:

```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tvoja_lozinka
DB_NAME=XP
JWT_SECRET=promijeni_ovo_u_dugi_random_secret
JWT_EXPIRES_IN=1d
```

Pokretanje servera:

```bash
cd server
npm install
npm run dev
```

Server se pokrece na:

```text
http://localhost:3000
```

### 4. Client konfiguracija

Frontend trenutno koristi API adresu:

```text
http://localhost:3000/api
```

Pokretanje clienta:

```bash
cd client
npm install
npm run dev
```

Quasar ce ispisati lokalni URL aplikacije, najcesce:

```text
http://localhost:9000
```

## Vazna napomena za uploadane dokumente

SQL dump trenutno moze sadrzavati apsolutne lokalne putanje do datoteka, npr. `/Users/.../server/uploads/...`.

To znaci:

- nakon importa na drugom laptopu stari attachmenti mozda nece raditi,
- potrebno je prenijeti i `server/uploads` mapu ako se zeli sacuvati dokumente,
- dugorocno je bolje u bazi spremati relativnu putanju ili storage key umjesto apsolutne putanje.

Za razvoj/demo najjednostavnije je importati bazu, ignorirati stare dokumente i uploadati nove.

## Sigurnosni model

Trenutno implementirano:

- JWT token autentikacija.
- Auth middleware na zasticenim API rutama.
- Role-based provjere za administratorske akcije.
- Parametrizirani SQL upiti.
- Backend validacija osnovnih inputa.
- Whitelist tipova datoteka za upload.
- Transakcije i `FOR UPDATE` lockovi za osjetljive promjene.
- State machine provjera statusa.

Preporuceno prije produkcije:

- ograniciti CORS na poznate domene,
- dodati rate limit za login,
- dodati Helmet,
- ne vracati `error.message` direktno klijentu u produkciji,
- provjeriti da `JWT_SECRET` postoji pri startupu servera,
- razmotriti httpOnly cookie auth umjesto `localStorage`,
- dodati backend i frontend testove.

## Testiranje i provjere

Trenutno:

```bash
cd client
npm run lint
npm run build
```

`client` build i lint prolaze. Projekt trenutno nema prave automatizirane testove. `client npm test` je placeholder, a `server` nema test skriptu.

Preporuceni minimalni testovi:

- login uspjesan/neuspjesan,
- kreiranje zahtjeva,
- zaposlenik vidi samo svoje zahtjeve,
- admin vidi sve zahtjeve,
- dozvoljene i zabranjene statusne tranzicije,
- upload pravila za `Ponuda` i `Otpremnica`.

## Sljedece dorade

Prioriteti:

- Dodati `.env.example`.
- Odvojiti cisti `schema.sql` i `seed.sql` od velikog razvojnog dumpa.
- Popraviti spremanje putanja uploadanih dokumenata.
- Uskladiti sve prikaze statusa u frontendu.
- Dodati osnovne backend testove za auth i workflow.
- Dodati security hardening: CORS whitelist, rate limit, Helmet.

Kasnije:

- Registracija korisnika uz `@veleri.hr` whitelist.
- Password reset putem emaila.
- Admin panel za korisnike.
- Email notifikacije za odobrenje, odbijanje i vracanje na izmjenu.
- Print/PDF obrazac zahtjeva.
- Docker setup.
- CI/CD.
- Backup strategija baze.

## Academic Context

Projekt se razvija u sklopu studija na:

**Veleuciliste u Rijeci**  
**Strucni diplomski studij Informacijske tehnologije u poslovnim sustavima**  
**Smjer: Programsko inzenjerstvo**

## Autor

**Igor Petkovic**
