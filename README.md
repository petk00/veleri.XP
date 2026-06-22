# veleri.XP

> Aplikacija za upravljanje zahtjevima za nabavu na Veleučilištu u Rijeci.

veleri.XP je full-stack web aplikacija za digitalizaciju procesa nabave: zaposlenik kreira zahtjev, administrator ga preuzima, odobrava ili vraća na izmjenu, a zahtjev se zatvara nakon dostave potrebne dokumentacije.

## Status projekta

![CI](https://github.com/petk00/veleri.XP/actions/workflows/ci.yml/badge.svg)

**Verzija:** 1.0  
**Faza:** MVP — funkcionalan end-to-end tijek nabave

### Implementirano

- Prijava korisnika (httpOnly JWT cookie).
- Dvije uloge: `Administrator` i `Zaposlenik`.
- Kreiranje, pregled, uređivanje i storniranje zahtjeva.
- Automatski broj zahtjeva u formatu `NAB-GGGG-NNNN`.
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
- Generiranje PDF dokumenta zahtjeva (samo za admin, status Naručeno/Zatvoreno).
- Unit testovi za backend (Jest) i frontend (Vitest).
- End-to-end testovi (Playwright) za ključne korisničke scenarije.
- Docker deployment (MySQL + Express backend + Quasar/nginx frontend).

### Nije implementirano / izvan opsega

- Financijski limiti po odjelu i kategoriji (polja postoje u bazi, logika nije aktivna).
- Draft zahtjeva — zahtjev se uvijek šalje odmah.
- Perzistentne notifikacije — in-app obavijesti ne pamte se između sesija.

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
| Baza | MySQL 8.0 |
| Auth | JWT (httpOnly cookie), bcrypt |
| Upload | Multer |
| PDF | jsPDF (client-side) |
| Testovi | Jest, Supertest (backend) · Vitest, jsdom (frontend) · Playwright (e2e) |
| Deployment | Docker, Docker Compose, nginx |

## Struktura projekta

```text
veleri.XP/
├── client/              # Vue 3 + Quasar frontend
│   ├── src/
│   │   ├── pages/       # Stranice aplikacije
│   │   ├── layouts/     # AuthLayout, MainLayout
│   │   ├── router/      # Routing i zaštita ruta
│   │   ├── boot/        # Axios konfiguracija
│   │   ├── composables/ # useActionableRequestsNotifier
│   │   └── __tests__/   # Vitest unit testovi
│   ├── public/          # Statički resursi (logo, fontovi)
│   ├── Dockerfile
│   └── nginx.conf
├── server/              # Node.js + Express backend
│   ├── src/
│   │   ├── routes/      # API rute (sva poslovna logika)
│   │   ├── middleware/  # Auth middleware
│   │   └── config/      # DB konfiguracija
│   ├── __tests__/       # Jest unit testovi
│   ├── scripts/         # Pomoćne skripte (npr. migracija putanja)
│   └── Dockerfile
├── e2e/                 # Playwright end-to-end testovi
│   ├── tests/
│   └── playwright.config.js
├── db/                  # SQL init skripte za Docker MySQL
│   ├── 01_schema.sql
│   └── 02_seed.sql
├── database/            # Originalni SQL dump i dokumentacija
├── docker-compose.yml
├── DOCS/
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

## Pokretanje putem Dockera (preporučeno)

### Postupak instalacije i pokretanja sustava

1. Instalirati [Docker Desktop](https://docs.docker.com/get-started/get-docker/) i pokrenuti ga.

2. Klonirati repozitorij aplikacije na lokalno računalo ili server:

```bash
git clone https://github.com/petk00/veleri.XP
cd veleri.XP
```

3. Kreirati `.env` datoteku u korijenu projekta s JWT tajnim ključem.

   **Najlakše (bilo koji OS) — ručno u Notepadu ili VS Code:**  
   Kreirati datoteku `.env` u korijenu projekta (`veleri.XP/.env`) s ovim sadržajem:
   ```
   JWT_SECRET=PROMIJENI_OVO_minimum_32_znaka_dugacak_kljuc_ovdje
   ```
   Zamijeniti `PROMIJENI_OVO_...` s proizvoljnim nizom od minimalno 32 znaka (slova, brojevi).

   **macOS / Linux / Git Bash:**
   ```bash
   echo "JWT_SECRET=$(openssl rand -base64 48)" > .env
   ```

   **Windows PowerShell 5.x** (standardni PowerShell na Windows 10/11):
   ```powershell
   $b = New-Object byte[] 48
   [Security.Cryptography.RNGCryptoServiceProvider]::new().GetBytes($b)
   "JWT_SECRET=$([Convert]::ToBase64String($b))" | Set-Content .env -Encoding ASCII
   ```

   **Windows PowerShell 7+:**
   ```powershell
   $b = [Security.Cryptography.RandomNumberGenerator]::GetBytes(48)
   "JWT_SECRET=$([Convert]::ToBase64String($b))" | Set-Content .env -Encoding utf8NoBOM
   ```

   > **Važno:** `.env` datoteka mora biti plain UTF-8 (bez BOM) ili ASCII — Docker Compose ne može čitati UTF-16 datoteke koje `Out-File` ponekad kreira na staroj PowerShell verziji.

   Bez `JWT_SECRET` backend odbija pokrenuti se. Za produkciju promijeniti i MySQL lozinke u `docker-compose.yml`.

4. Izgraditi i pokrenuti sve kontejnere:

```bash
docker compose up --build
```

5. Nakon što sva tri kontejnera budu pokrenuta (poruka `Server running on http://localhost:3000` u logu), aplikacija je dostupna u web pregledniku na adresi:

```
https://localhost
```

> **Napomena:** Preglednik će prikazati sigurnosno upozorenje za self-signed SSL certifikat — kliknite *Napredno* → *Nastavi prema localhost* (ili ekvivalent u vašem pregledniku).

6. Za prijavu u aplikaciju koristiti inicijalne korisničke račune iz seed podataka:

```
Administrator:  admin@veleri.hr
Zaposlenik:     zaposlenik@veleri.hr

Lozinka za oba računa: 12345678
```

### Napomene za produkcijski deploy

- Generirati jak JWT tajni ključ i postaviti ga u `.env` u korijenu projekta: `echo "JWT_SECRET=$(openssl rand -base64 48)" > .env` — backend odbija pokrenuti bez njega.
- U `docker-compose.yml` promijeniti MySQL lozinke (`MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`, `MYSQL_USER`/`DB_PASSWORD`) i `API_URL`.
- `API_URL` mora biti javna IP adresa ili domena servera bez broja porta (nginx proxira; npr. `https://192.168.1.100/api`).
- MySQL init skripte (`db/`) se izvršavaju samo pri prvom pokretanju. Za čisti reinit: `docker compose down -v && docker compose up --build`.
- Uploadani dokumenti čuvaju se u named volumenu `uploads` i ostaju perzistentni između restartova.

## Lokalno pokretanje (bez Dockera)

### 1. Baza podataka

Instalirati MySQL 8.0, zatim kreirati bazu i importati init skripte:

```bash
mysql -u root -p -e "CREATE DATABASE XP CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p XP < db/01_schema.sql
mysql -u root -p XP < db/02_seed.sql
```

### 2. Backend

```bash
cd server
cp .env.example .env   # prilagoditi lozinke i JWT_SECRET
npm install
npm run dev
```

Server se pokreće na `http://localhost:3000`.

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

Quasar će ispisati lokalni URL, najčešće `http://localhost:9000`.

## Početni korisnički računi

| Uloga | E-mail | Lozinka |
|---|---|---|
| Administrator | `admin@veleri.hr` | `12345678` |
| Zaposlenik | `zaposlenik@veleri.hr` | `12345678` |

## Testiranje

**Backend** (iz `server/` mape):

```bash
npm test
```

Pokriva: generiranje broja zahtjeva, state machine promjena statusa, pravila uploada dokumenata.

**Frontend** (iz `client/` mape):

```bash
npm test
```

Pokriva: `authStorage` (parsiranje korisnika iz localStorage), `useActionableRequestsNotifier` (API pozivi, deduplikacija notifikacija).

**End-to-end testovi** (iz `e2e/` mape, zahtijeva pokrenute backend i frontend servise):

```bash
cd e2e
npm test
```

Pokriva: prijavu korisnika, kreiranje zahtjeva, workflow (preuzmi / vrati na izmjenu / pošalji ponovo), kontrolu pristupa, zaključavanje zatvorenih zahtjeva.

> **Lokalno pokretanje:** Testovi zahtijevaju istovremeno pokrenute backend (`npm run dev` u `server/`) i frontend (`npm run dev` u `client/`), s inicijaliziranom bazom. U CI-ju se svi servisi automatski podižu unutar pipeline-a.

Za interaktivni UI mod:

```bash
npm run test:ui
```

**Lint i build provjera:**

```bash
cd client
npm run lint
npm run build
```

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
