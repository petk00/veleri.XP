# 📦 veleri.XP

> Aplikacija za upravljanje zahtjevima za nabavu — Veleučilište u Rijeci

---

## 🍎 WHAT'S NEXT? [upute sa sastanka]
- registracija (password reset mail)
- draft vratiti
- personalizirani uxui (korisnik\admin)
- filter / search po korisniku definitivno
- security hardening
- ponuda moze imati vise

## ✅ Napravljeno do sada

### 🔐 Autentikacija i sigurnost
- Login s email/lozinka (bcrypt hash)
- JWT token autentikacija
- Route guard (zaštićene rute)
- Logout
- Role-based access control (Administrator / Zaposlenik)
- localStorage reactivity fix za Vue computed

### 👤 Korisnici
- Dva korisnička tipa: Administrator i Zaposlenik
- Zaposlenik vidi samo svoje zahtjeve
- Administrator vidi sve zahtjeve

### 📝 Kreiranje zahtjeva (6-koračni Wizard)
- Korak 1: Odabir odjela / službe / projekta
- Korak 2: Obrazloženje nabave (textarea, do 1000 znakova)
- Korak 3: Dodavanje stavki (kategorija, naziv, količina)
- Korak 4: Procjena iznosa (neobavezno, s "Preskoči" opcijom)
- Korak 5: Ponuda Da/Ne s upload-om (vizualne kartice)
- Korak 6: Pregled i slanje
- Sidebar progress tracker
- Automatski upload ponude odmah nakon kreiranja zahtjeva

### 📋 Lista zahtjeva
- Tablica s brojem, odjelom, statusom, kreatorom, iznosom, datumom
- Status chipovi u bojama
- Klik na red → detalji zahtjeva
- Zaposlenik vidi samo svoje, admin vidi sve

### 🔍 Detalji zahtjeva
- Header s brojem zahtjeva i status chipom
- Osnovni podaci + Obrazloženje (side-by-side layout)
- Tablica stavki
- Sekcija dokumenata s indikatorima (Ponuda ✓/✗, Otpremnica ✓/✗)
- Upload, download i brisanje dokumenata
- Admin akcijska kartica (Odobri/Odbij)
- Admin završna kartica (Označi završeno)
- Timeline / Povijest aktivnosti

### ✏️ Uređivanje zahtjeva (Admin)
- Zasebna edit stranica (/requests/:id/edit)
- Admin može mijenjati: odjel, obrazloženje, stavke, iznos
- Zaključano za statusе Završeno i Odbijeno
- Izmjena se bilježi u povijest aktivnosti

### ✅ Approval workflow
- Admin odobrava ili odbija zahtjev (samo iz statusa "U obradi")
- Odbijanje zahtijeva obavezan komentar
- Označi završeno blokirano dok nema i Ponude i Otpremnice
- State machine zaštita (nemoguće preskočiti korake)

### 📎 Upravljanje dokumentima
- Upload Ponude i Otpremnice (whitelist tipova, max 10MB)
- Fajlovi se spremnaju na server filesystem (uploads/attachments/{id}/)
- Download direktno iz browsera
- Brisanje (samo admin)
- Završi zahtjev blokiran dok nema oba dokumenta

### 📜 Povijest aktivnosti (Audit trail)
- Svaka promjena statusa se bilježi (tko, kad, komentar)
- Upload dokumenta bilježi se kao "Dokument dodan"
- Izmjena zahtjeva bilježi se kao aktivnost
- Različite boje i ikone po tipu aktivnosti

### 🗄️ Baza podataka
- Svi statusi i role na hrvatskom jeziku
- Transakcije za atomične operacije
- FOR UPDATE lock za race condition zaštitu
- Automatsko generiranje broja zahtjeva (PR-GGGG-XXXX)
- Kompletni audit trail kroz RequestStatusHistory

---

## 🔄 Workflow zahtjeva

```
[Zaposlenik kreira]
        ↓
     [Skica] ──→ može se editirati (samo admin)
        ↓ pošalji
    [U obradi] ──→ admin pregledava
    ↙         ↘
[Odbijeno]  [Odobreno] ──→ zaključano za edit
  Kraj           ↓
          dodaj Ponudu + Otpremnicu
                 ↓
           [Završeno] ──→ zaključano za edit
```

---

## 🎯 Ciljevi projekta

- Digitalizirati proces nabave na Veleučilištu u Rijeci
- Smanjiti ručni rad i nepreglednost papirnatog procesa
- Omogućiti jasniji tijek obrade zahtjeva
- Osigurati bolju evidenciju i pregled podataka
- Uvesti audit trail za sve akcije u sustavu

---

## 👥 Role korisnika

| Rola | Može |
|---|---|
| **Zaposlenik** | Kreirati zahtjev, vidjeti svoje zahtjeve, dodavati dokumente |
| **Administrator** | Sve što Zaposlenik + odobravati/odbijati/zatvarati zahtjeve, editirati zahtjeve, vidjeti sve zahtjeve, brisati dokumente |

---

## ⚙️ Ključne funkcionalnosti

- Kreiranje i upravljanje zahtjevima za nabavu
- 6-koračni wizard za intuitivno kreiranje
- Approval workflow s komentarima
- Upravljanje dokumentacijom (Ponuda, Otpremnica)
- Kompletni audit trail svih aktivnosti
- Role-based access control
- Autentikacija i autorizacija korisnika
- Financijska evidencija (procjena iznosa)

---

## 🛠 Tech Stack

| Sloj | Tehnologija |
|---|---|
| **Frontend** | Vue.js 3 + Quasar Framework (Composition API) |
| **Backend** | Node.js + Express 5 |
| **Baza** | MySQL / MariaDB |
| **Auth** | JWT (jsonwebtoken) + bcrypt |
| **File upload** | Multer |
| **API** | REST |
| **Dev** | Nodemon, ESLint, Prettier |

---

## 🔐 Sigurnosni model

- JWT token u localStorage (1 dan expiry)
- Sve API rute zaštićene auth middlewareom
- Role provjera na svakoj osjetljivoj ruti (403 Forbidden)
- Validacija inputa na backendu za sve rute
- SQL injection zaštita (parametrizirani upiti)
- Whitelist tipova fajlova za upload
- FOR UPDATE lock za race condition zaštitu
- State machine zaštita statusa (nemoguće preskočiti korake)

---

## 🔵 U planu (NEXT)

- Registracija novih korisnika (@veleri.hr whitelist)
- Personalizirani Dashboard
- Filter i search na listi zahtjeva
- Admin panel za upravljanje korisnicima
- Email notifikacije (odobrenje/odbijanje)
- Print / PDF obrazac zahtjeva

---

## 🔵 Kasnije (LATER)

- Microsoft / AAI@EduHr SSO login
- Security hardening (rate limiting, Helmet, CORS whitelist)
- Docker i CI/CD
- Backup strategija
- Monitoring i logging

---

## 📌 Status projekta

**Verzija:** 0.2  
**Faza:** MVP u razvoju — demo sprint

Aplikacija ima kompletan end-to-end workflow: kreiranje zahtjeva → obrada → odobravanje → dokumentacija → zatvaranje.

---

## 🧠 Development Approach

**KISS — Keep It Simple, Stupid**

Cilj je izgraditi sustav koji je:
- jednostavan za korištenje
- logičan za održavanje
- dovoljno fleksibilan za buduće proširenje

Razvoj ide sprint po sprint, s demo-driven pristupom.

---

## 🎓 Academic Context

Projekt se razvija u sklopu studija na:

**Veleučilište u Rijeci**  
**Stručni diplomski studij Informacijske tehnologije u poslovnim sustavima**  
**Smjer: Programsko inženjerstvo**

---

## ✍️ Author

**Igor Petković**

---

## 🧱 Struktura projekta

```text
veleri.XP/
├── client/          # Vue 3 + Quasar frontend
│   └── src/
│       ├── pages/   # Stranice aplikacije
│       ├── router/  # Routing
│       ├── boot/    # Axios i ostali boot fajlovi
│       └── stores/  # Pinia stores
├── server/          # Node.js + Express backend
│   └── src/
│       ├── routes/      # API rute
│       ├── middleware/  # Auth middleware
│       └── config/      # DB konfiguracija
├── database/        # SQL dump i modeli
├── docs/            # Dokumentacija i dijagrami
└── README.md
```
