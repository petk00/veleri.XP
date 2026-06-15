# veleri.XP

> Aplikacija za upravljanje zahtjevima za nabavu na Veleučilištu u Rijeci.

veleri.XP je full-stack web aplikacija za digitalizaciju procesa nabave: zaposlenik kreira zahtjev, administrator ga preuzima, odobrava ili vraća na izmjenu, a zahtjev se zatvara nakon dostave potrebne dokumentacije.

## Status projekta

**Verzija:** 1.0  
**Faza:** MVP — funkcionalan end-to-end tijek nabave

### Implementirano

- Prijava korisnika (httpOnly JWT cookie).
- Dvije uloge: `Administrator` i `Zaposlenik`.
- Kreiranje, pregled, uređivanje i storniranje zahtjeva.
- Automatski broj zahtjeva u formatu `PR-GGGG-NNNN`.
- Odabir aktivne poslovne godine, odjela i kategorije nabave.
- Unos stavki i količina; provjera da stavke i odjel pripadaju istoj godini.
- Serverska paginacija i filteri (status, odjel, korisnik, godina, kategorija, pretraga).
- Kompletan workflow statusa s provjerom ovlasti.
- Upload, download i brisanje dokumenata (`Ponuda`, `Otpremnica`).
- Audit trail kroz povijest aktivnosti (`RequestStatusHistory`).
- In-app obavijesti o promjenama statusa.
- Admin upravljanje korisnicima (CRUD, invite link, deaktivacija).
- Admin upravljanje poslovnim godinama, odjelima i kategorijama.
- Kopiranje šifrarnika pri otvaranju nove poslovne godine.
- Security hardening: CORS whitelist, rate limiting, Helmet, path traversal zaštita.
- Unit testovi za backend (Jest) — generiranje broja zahtjeva, state machine, upload pravila.

### Nije implementirano / izvan opsega

- Financijski limiti po odjelu i kategoriji (polja postoje u bazi, logika nije aktivna).
- Draft zahtjeva — zahtjev se uvijek šalje odmah.
- Perzistentne notifikacije — in-app obavijesti ne pamte se između sesija.
- Email notifikacije.
- Produkcijski deployment (Docker, instalacijska skripta).

## Dokumentacija

| Dokument | Opis |
|---|---|
| `DOCS/SRS_STATUS.md` | Status implementacije prema SRS zahtjevima. |
| `DOCS/ARHITEKTURA.md` | Arhitektura sustava i opis slojeva. |
| `DOCS/API.md` | REST API dokumentacija. |
| `DOCS/BAZA_PODATAKA.md` | Dokumentacija baze podataka. |
| `DOCS/KORISNICKE_UPUTE.md` | Korisničke upute za zaposlenika i administratora. |
| `DOCS/TEST_PLAN.md` | Plan testiranja. |
| `DOCS/PLAN_DORADA.md` | Preporučeni redoslijed daljnjih dorada. |

## Tech Stack

| Sloj | Tehnologija |
|---|---|
| Frontend | Vue 3, Quasar Framework, Composition API |
| Backend | Node.js, Express 5 |
| Baza | MySQL / MariaDB |
| Auth | JWT (httpOnly cookie), bcrypt |
| Upload | Multer |
| Testovi | Jest, Supertest |

## Struktura projekta

```text
veleri.XP/
├── client/              # Vue 3 + Quasar frontend
│   └── src/
│       ├── pages/       # Stranice aplikacije
│       ├── layouts/     # AuthLayout, MainLayout
│       ├── router/      # Routing i zaštita ruta
│       ├── boot/        # Axios konfiguracija
│       ├── composables/ # useActionableRequestsNotifier
│       └── stores/      # Pinia
├── server/              # Node.js + Express backend
│   ├── src/
│   │   ├── routes/      # API rute (sva poslovna logika)
│   │   ├── middleware/  # Auth middleware
│   │   └── config/      # DB konfiguracija
│   └── __tests__/       # Jest unit testovi
├── database/            # SQL dump i modeli baze
├── DOCS/                # Dokumentacija i dijagrami
└── README.md
```

## Workflow zahtjeva

```text
[Zaposlenik kreira zahtjev]
        |
        v
   [Poslano]
    |      |
    |      | admin: odbij
    |      v
    |  [Odbijeno]
    |
    | admin: preuzmi
    v
[Na odobrenju]
    |          |
    |          | admin: vrati-na-izmjenu
    |          v
    |    [Vraćeno na dopunu]
    |      |           |
    |      | zaposlenik:| admin:
    |      | resubmit   | vrati-u-obradu
    |      v           |
    |   [Poslano] <----+
    |
    | admin: odobri (zahtijeva Ponudu)
    v
  [Naručeno]
        |
        | admin: završi (zahtijeva Ponudu + Otpremnicu + iznos)
        v
  [Zatvoreno]

Admin može stornirati zahtjev iz bilo kojeg aktivnog statusa → [Odbijeno].
```

| ID | Status |
|---:|---|
| 1 | Poslano |
| 2 | Na odobrenju |
| 3 | Vraćeno na dopunu/izmjenu |
| 5 | Odbijeno |
| 6 | Naručeno |
| 7 | Zatvoreno |

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

Import postojećeg dumpa:

```bash
mysql -u root -p XP < database/dump-XP-202605061957.sql
```

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
CLIENT_URL=http://localhost:9000
```

Pokretanje servera:

```bash
cd server
npm install
npm run dev
```

Server se pokreće na `http://localhost:3000`.

### 4. Client konfiguracija

API adresa se konfigurira kroz env varijablu. Zadana vrijednost za razvoj je `http://localhost:3000/api`.

Za drugačiju adresu, postaviti `API_URL` u `.env` datoteci u `client/` mapi:

```env
API_URL=http://localhost:3000/api
```

Pokretanje clienta:

```bash
cd client
npm install
npm run dev
```

Quasar će ispisati lokalni URL, najčešće `http://localhost:9000`.

## Početni korisnički računi

SQL dump uključuje dva testna korisnika dostupna odmah nakon importa baze:

| Uloga | E-mail | Lozinka |
|---|---|---|
| Administrator | `admin@veleri.hr` | `12345678` |
| Zaposlenik | `zaposlenik@veleri.hr` | `12345678` |

## Testiranje

Backend unit testovi pokreću se iz `server/` mape:

```bash
cd server
npm test
```

Testovi pokrivaju:
- generiranje broja zahtjeva (`PR-GGGG-NNNN` format, inkrement, zatvorena godina)
- state machine promjena statusa (ovlasti, komentari, dokumenti, zaključani statusi)
- pravila uploada dokumenata (`UPLOAD_RULES` po statusu, zaključani zahtjevi)

Frontend provjere:

```bash
cd client
npm run lint
npm run build
```

## Napomena za uploadane dokumente

SQL dump može sadržavati apsolutne lokalne putanje do datoteka (`/Users/.../server/uploads/...`). Nakon importa na drugom računalu stari attachmenti neće raditi. Potrebno je prenijeti i `server/uploads/` mapu ili uploadati dokumente iznova.

## Sigurnosni model

- JWT autentikacija putem `httpOnly` cookie-ja (`sameSite: strict`, `secure` u produkciji).
- bcrypt hashiranje lozinki.
- Role-based provjere za sve administratorske akcije.
- Parametrizirani SQL upiti (zaštita od SQL injekcije).
- CORS whitelist konfiguriran kroz env varijablu `CLIENT_URL`.
- Rate limiting: login (20 pokušaja / 15 min), set-password (10 pokušaja / sat).
- Helmet middleware (sigurnosni HTTP headeri).
- Provjera postojanja obaveznih env varijabli pri pokretanju servera.
- Whitelist dozvoljenih MIME tipova za upload.
- Zaštita od path traversal napada kod preuzimanja dokumenata.
- Transakcije i `FOR UPDATE` lockovi za osjetljive promjene statusa.
- API ne vraća `error.message` niti stack trace klijentu.

## Academic Context

Projekt se razvija u sklopu studija na:

**Veleučilište u Rijeci**  
**Stručni diplomski studij Informacijske tehnologije u poslovnim sustavima**  
**Smjer: Programsko inženjerstvo**

## Autor

**Igor Petkovic**
