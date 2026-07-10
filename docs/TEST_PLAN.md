# Test plan

Ovaj dokument opisuje plan testiranja sustava za upravljanje zahtjevima za nabavu.
Plan je usklađen s trenutnim MVP opsegom aplikacije i zahtjevima iz SRS-a.

Zadnja provjera: **2026-07-10**

## 4.3. Testiranje sustava

Testiranje sustava provodi se kroz tri razine:

1. Unit testovi
2. Funkcijski end-user testovi
3. Prihvatni (acceptance) test

Cilj testiranja je potvrditi da osnovni proces nabave radi ispravno: prijava korisnika, kreiranje zahtjeva, pregled zahtjeva, promjene statusa, dodavanje dokumenata i pregled povijesti aktivnosti.

## 4.3.1. Izrada unit testova

Unit testovi provjeravaju manje, izolirane dijelove sustava. Projekt trenutno ima automatizirane backend testove u `server/__tests__/` i frontend testove u `client/src/__tests__/`.

Pri zadnjoj provjeri lokalno prolazi:

- backend: 60 Jest/Supertest testova,
- frontend: 29 Vitest testova,
- frontend lint: bez grešaka.

Tablice u nastavku služe kao pokrivenost ključnih scenarija i kontrolna lista za buduće proširenje testova.

### Backend unit testovi

| ID | Područje | Test | Očekivani rezultat |
|---|---|---|---|
| UT-01 | Autentikacija | Login bez emaila ili lozinke | API vraća status 400 i poruku da su email i lozinka obavezni. |
| UT-02 | Autentikacija | Login s nepostojećim korisnikom | API vraća status 401. |
| UT-03 | Autentikacija | Login s neispravnom lozinkom | API vraća status 401. |
| UT-04 | Autentikacija | Login s neaktivnim korisnikom | API vraća status 403. |
| UT-05 | Autentikacija | Login s ispravnim podacima | API vraća JWT token i podatke korisnika. |
| UT-06 | Middleware | Zaštićena ruta bez tokena | API vraća status 401. |
| UT-07 | Middleware | Zaštićena ruta s neispravnim tokenom | API vraća status 401. |
| UT-08 | Zahtjevi | Kreiranje zahtjeva bez poslovne godine ili odjela | API vraća status 400. |
| UT-09 | Zahtjevi | Kreiranje zahtjeva bez obrazloženja | API vraća status 400. |
| UT-10 | Zahtjevi | Kreiranje zahtjeva bez stavki | API vraća status 400. |
| UT-11 | Zahtjevi | Kreiranje zahtjeva s neispravnom količinom | API vraća status 400. |
| UT-12 | Zahtjevi | Kreiranje zahtjeva s ispravnim podacima | API kreira zahtjev, generira broj zahtjeva i vraća status 201. |
| UT-13 | Workflow | Admin preuzima zahtjev u statusu Poslano | Status zahtjeva prelazi u Na odobrenju. |
| UT-14 | Workflow | Neadmin korisnik pokušava administratorsku akciju | API vraća status 403. |
| UT-15 | Workflow | Akcija nije dozvoljena u trenutnom statusu | API vraća status 400. |
| UT-16 | Workflow | Odbijanje bez komentara | API vraća status 400. |
| UT-17 | Dokumenti | Upload dokumenta s nedozvoljenim tipom | API odbija upload. |
| UT-18 | Dokumenti | Upload dokumenta većeg od 10 MB | API odbija upload. |
| UT-19 | Dokumenti | Upload ponude u dozvoljenom statusu | Dokument se sprema i zapisuje u povijest. |
| UT-20 | Dokumenti | Upload otpremnice prije statusa Naručeno | API vraća status 400. |

### Frontend unit testovi

| ID | Područje | Test | Očekivani rezultat |
|---|---|---|---|
| UT-FE-01 | Login forma | Korisnik nastavlja bez emaila | Prikazuje se validacijska poruka. |
| UT-FE-02 | Login forma | Korisnik unosi email i prelazi na unos lozinke | Forma prikazuje polje za lozinku. |
| UT-FE-03 | Novi zahtjev | Korisnik ne odabere odjel | Prikazuje se poruka o obaveznom odabiru. |
| UT-FE-04 | Novi zahtjev | Korisnik odabere da ima ponudu, ali ne doda datoteku | Slanje nije dopušteno. |
| UT-FE-05 | Novi zahtjev | Korisnik doda stavku bez naziva ili količine | Prikazuje se validacijska poruka. |
| UT-FE-06 | Lista zahtjeva | Filter po statusu | Prikazuju se samo zahtjevi odabranog statusa. |
| UT-FE-07 | Detalji zahtjeva | Zatvoreni zahtjev | Akcije uređivanja i brisanja dokumenata nisu dostupne. |

### Implementirani alati

| Sloj | Alat | Status |
|---|---|---|
| Backend | Jest, Supertest | Implementirano |
| Frontend | Vitest, jsdom | Implementirano |
| E2E | Playwright | Implementirano |

### Implementirani automatizirani testovi

| Sloj | Datoteke | Pokrivenost |
|---|---|---|
| Backend unit/API | `server/__tests__/budgetImpact.test.js`, `requestNumber.test.js`, `statusMachine.test.js`, `uploadRules.test.js` | Budžetska projekcija, generiranje broja zahtjeva, statusni workflow, pravila uploada i validacije dokumenata. |
| Backend integracijski | `server/__tests__/integration/api.integration.test.js` | Login/cookie tok, role, korisnici, limiti kategorija, workflow zahtjeva i izolacija podataka po korisniku nad testnom MySQL bazom. |
| Frontend unit | `client/src/__tests__/authStorage.test.js`, `budgetMath.test.js`, `notifier.test.js` | Lokalna pohrana korisnika, izračuni budžeta i logika in-app obavijesti. |

## 4.3.2. End-to-end (e2e) testovi

E2e testovi implementirani su pomoću **Playwright** alata i nalaze se u mapi `e2e/tests/`. Pokrivaju ključne korisničke scenarije opisane u nastavku i izvršavaju se nad stvarnom pokrenutom aplikacijom.

Pokretanje:

```bash
cd e2e
npm test          # headless
npm run test:ui   # interaktivni UI mod
```

### Implementirani e2e testovi

| Datoteka | Scenarij |
|---|---|
| `auth.spec.js` | Prijava admina, prijava zaposlenika, pogrešna lozinka, neautoriziran pristup, admin route guard (zaposlenik ne može na /korisnici i /financije), odjava |
| `requests.spec.js` | Kreiranje zahtjeva bez ponude kroz wizard, zaposlenik ne vidi kolonu podnositelja, admin vidi sve zahtjeve |
| `workflow.spec.js` | Puni životni ciklus: kreiranje s ponudom i iznosom → preuzimanje → odobravanje (s pregledom limita odjela, SRS 7.3) → upload otpremnice → zatvaranje; vraćanje na dopunu + ponovno slanje; storniranje |
| `documents.spec.js` | Upload i brisanje ponude na detaljima zahtjeva |
| `financije.spec.js` | Pregled budžeta; dodavanje/uređivanje/brisanje kategorije s limitom (SRS 7.1) |
| `korisnici.spec.js` | Kreiranje korisnika s invite linkom, odbijanje emaila izvan @veleri.hr domene, aktivacija/deaktivacija/brisanje |

Napomena: u CI-ju se prije e2e testova uvozi `e2e/seed.e2e.sql` (aktivna poslovna godina, odjeli i kategorije) jer produkcijski seed namjerno ne sadrži šifrarnike.

## 4.3.3. API integracijski testovi (prava baza)

Integracijski testovi nalaze se u `server/__tests__/integration/` i za razliku od unit testova ne mockaju ništa: pri pokretanju kreiraju zasebnu bazu `XP_test` (iz `db/01_schema.sql`, `db/02_seed.sql` i `e2e/seed.e2e.sql`) pa supertestom gađaju montiranu Express aplikaciju kroz pune middleware lance (autentikacija, role, validacije, transakcije). Ako MySQL nije dostupan, testovi se preskaču s upozorenjem. Pokrivaju: login/cookie tok, zaštitu ruta po rolama, kreiranje korisnika s invite linkom i domenskim pravilom, validaciju limita kategorija protiv budžeta (SRS 7.1), workflow zahtjeva (kreiranje, preuzimanje, odbijanje odobrenja bez ponude) i izolaciju zahtjeva po korisniku. U CI-ju backend job ima MySQL servis.

Pokretanje: `cd server && npx jest __tests__/integration`

## 4.3.4. Funkcijski end-user testovi (ručni)

Funkcijski end-user testovi provode se ručno iz perspektive stvarnog korisnika aplikacije.

### Scenarij 1: Uspješna prijava djelatnika

| Korak | Akcija | Očekivani rezultat |
|---|---|---|
| 1 | Korisnik otvara aplikaciju. | Prikazuje se login ekran. |
| 2 | Korisnik unosi email i lozinku. | Sustav prihvaća podatke. |
| 3 | Korisnik klikne prijavu. | Korisnik se preusmjerava na početni ekran. |
| 4 | Korisnik otvara popis zahtjeva. | Prikazuju se samo njegovi zahtjevi. |

### Scenarij 2: Neuspješna prijava

| Korak | Akcija | Očekivani rezultat |
|---|---|---|
| 1 | Korisnik unosi pogrešnu lozinku. | Sustav ne dopušta prijavu. |
| 2 | Sustav prikazuje poruku greške. | Korisnik ostaje na login ekranu. |

### Scenarij 3: Kreiranje zahtjeva bez ponude

| Korak | Akcija | Očekivani rezultat |
|---|---|---|
| 1 | Djelatnik klikne "Novi zahtjev". | Otvara se obrazac za novi zahtjev. |
| 2 | Odabire mjesto troška. | Odabir se sprema u formi. |
| 3 | Odabire opciju da nema ponudu. | Prikazuje se unos stavki. |
| 4 | Unosi svrhu nabave. | Tekst se sprema u formi. |
| 5 | Dodaje jednu ili više stavki. | Stavke su vidljive u pregledu. |
| 6 | Klikne slanje zahtjeva. | Sustav kreira zahtjev u statusu Poslano. |

### Scenarij 4: Kreiranje zahtjeva s ponudom

| Korak | Akcija | Očekivani rezultat |
|---|---|---|
| 1 | Djelatnik odabire opciju da ima ponudu. | Prikazuje se upload ponude. |
| 2 | Dodaje dopuštenu datoteku. | Datoteka se prikazuje u popisu. |
| 3 | Unosi iznos, predmet nabave i svrhu. | Forma prihvaća podatke. |
| 4 | Šalje zahtjev. | Zahtjev se kreira, a ponuda se dodaje na zahtjev. |

### Scenarij 5: Administrator preuzima i obrađuje zahtjev

| Korak | Akcija | Očekivani rezultat |
|---|---|---|
| 1 | Administrator se prijavljuje. | Prikazuje se administratorski pregled. |
| 2 | Otvara zahtjev u statusu Poslano. | Prikazuju se detalji zahtjeva. |
| 3 | Klikne akciju preuzimanja. | Status prelazi u Na odobrenju. |
| 4 | Ako postoji ponuda, administrator može odobriti zahtjev. | Status prelazi u Naručeno. |
| 5 | Ako zahtjev nije ispravan, administrator ga vraća na dopunu. | Status prelazi u Vraćeno na dopunu/izmjenu. |

### Scenarij 6: Vraćanje zahtjeva na dopunu

| Korak | Akcija | Očekivani rezultat |
|---|---|---|
| 1 | Administrator vraća zahtjev djelatniku uz komentar. | Komentar se sprema u povijest. |
| 2 | Djelatnik otvara aplikaciju. | Vidi obavijest da je zahtjev vraćen. |
| 3 | Djelatnik otvara zahtjev. | Prikazuje se komentar administratora. |
| 4 | Djelatnik uređuje zahtjev i ponovno ga šalje. | Status se vraća u Poslano. |

### Scenarij 7: Dodavanje otpremnice i zatvaranje zahtjeva

| Korak | Akcija | Očekivani rezultat |
|---|---|---|
| 1 | Zahtjev je u statusu Naručeno. | Dostupna je mogućnost dodavanja otpremnice. |
| 2 | Korisnik dodaje otpremnicu. | Dokument je vidljiv na detalju zahtjeva. |
| 3 | Administrator zatvara zahtjev. | Status prelazi u Zatvoreno. |
| 4 | Korisnik pokušava uređivati zatvoreni zahtjev. | Sustav ne dopušta izmjene. |

### Scenarij 8: Pregled i filtriranje zahtjeva

| Korak | Akcija | Očekivani rezultat |
|---|---|---|
| 1 | Korisnik otvara listu zahtjeva. | Prikazuje se tablica zahtjeva. |
| 2 | Korisnik pretražuje po broju zahtjeva. | Lista se filtrira prema unosu. |
| 3 | Korisnik filtrira po statusu. | Prikazuju se samo zahtjevi odabranog statusa. |
| 4 | Administrator filtrira po mjestu troška ili korisniku. | Prikazuju se odgovarajući zahtjevi. |

## 4.3.3. Izrada prihvatnog (acceptance) testa

Prihvatni test potvrđuje da aplikacija zadovoljava minimalni poslovni proces potreban za MVP.
Test se provodi ručno pred kraj implementacije ili prije predaje projekta.

### Preduvjeti

- Baza podataka je importirana i dostupna.
- Backend server je pokrenut.
- Frontend aplikacija je pokrenuta.
- Postoji najmanje jedan korisnik s ulogom `Zaposlenik`.
- Postoji najmanje jedan korisnik s ulogom `Administrator`.
- Postoji aktivna poslovna godina.
- Postoje aktivna mjesta troška i predmeti nabave.

### Acceptance test AT-01: Osnovni proces zahtjeva za nabavu

| Korak | Akcija | Očekivani rezultat | Status |
|---|---|---|---|
| 1 | Djelatnik se prijavljuje u sustav. | Prijava je uspješna. | Nije izvršeno |
| 2 | Djelatnik kreira novi zahtjev. | Sustav dodjeljuje jedinstveni broj zahtjeva. | Nije izvršeno |
| 3 | Djelatnik odabire mjesto troška i predmet nabave. | Odabrani podaci su spremljeni na zahtjevu. | Nije izvršeno |
| 4 | Djelatnik unosi svrhu i stavke zahtjeva. | Stavke su prikazane na pregledu zahtjeva. | Nije izvršeno |
| 5 | Djelatnik šalje zahtjev. | Zahtjev je u statusu Poslano. | Nije izvršeno |
| 6 | Administrator se prijavljuje. | Administrator vidi sve zahtjeve. | Nije izvršeno |
| 7 | Administrator otvara novi zahtjev. | Prikazuju se detalji, stavke, dokumenti i povijest. | Nije izvršeno |
| 8 | Administrator preuzima zahtjev. | Status prelazi u Na odobrenju. | Nije izvršeno |
| 9 | Administrator odobrava zahtjev. | Status prelazi u Naručeno. | Nije izvršeno |
| 10 | Korisnik dodaje otpremnicu. | Otpremnica je prikazana na zahtjevu. | Nije izvršeno |
| 11 | Administrator zatvara zahtjev. | Status prelazi u Zatvoreno. | Nije izvršeno |
| 12 | Korisnik pokušava mijenjati zatvoreni zahtjev. | Sustav ne dopušta izmjene. | Nije izvršeno |

### Acceptance test AT-02: Vraćanje zahtjeva na dopunu

| Korak | Akcija | Očekivani rezultat | Status |
|---|---|---|---|
| 1 | Djelatnik kreira i šalje zahtjev. | Zahtjev je u statusu Poslano. | Nije izvršeno |
| 2 | Administrator preuzima zahtjev. | Status prelazi u Na odobrenju. | Nije izvršeno |
| 3 | Administrator vraća zahtjev na dopunu uz komentar. | Status prelazi u Vraćeno na dopunu/izmjenu. | Nije izvršeno |
| 4 | Djelatnik vidi obavijest o vraćenom zahtjevu. | Obavijest je prikazana u aplikaciji. | Nije izvršeno |
| 5 | Djelatnik uređuje zahtjev. | Izmjene su spremljene. | Nije izvršeno |
| 6 | Djelatnik ponovno šalje zahtjev. | Status prelazi u Poslano. | Nije izvršeno |

### Acceptance test AT-03: Kontrola pristupa

| Korak | Akcija | Očekivani rezultat | Status |
|---|---|---|---|
| 1 | Djelatnik otvara listu zahtjeva. | Vidi samo vlastite zahtjeve. | Nije izvršeno |
| 2 | Djelatnik pokušava otvoriti tuđi zahtjev direktnim URL-om. | Sustav vraća grešku ili ne prikazuje zahtjev. | Nije izvršeno |
| 3 | Djelatnik pokušava izvršiti administratorsku akciju. | Sustav odbija akciju. | Nije izvršeno |
| 4 | Administrator otvara listu zahtjeva. | Vidi sve zahtjeve u sustavu. | Nije izvršeno |

## Kriteriji prihvaćanja MVP-a

MVP se smatra prihvatljivim ako su ispunjeni sljedeći uvjeti:

- Korisnik se može prijaviti u sustav.
- Djelatnik može kreirati i poslati zahtjev.
- Administrator može vidjeti sve zahtjeve.
- Djelatnik vidi samo vlastite zahtjeve.
- Administrator može preuzeti, vratiti, odobriti i zatvoriti zahtjev.
- Sustav omogućuje dodavanje ponude i otpremnice.
- Zatvoreni zahtjev nije moguće mijenjati.
- Povijest aktivnosti vidljiva je na detalju zahtjeva.
- Osnovna pretraga i filtriranje zahtjeva rade na korisničkom sučelju.

## Poznata ograničenja testiranja

- Lokalno pokretanje e2e testova zahtijeva pokrenuti frontend (`localhost:9000`) i backend (`localhost:3000`) te postavljenu bazu s inicijalnim podacima; u CI-ju se frontend, backend i MySQL servis podižu automatski.
- Workflow testovi koji ovise o stanju baze (npr. postojanje vraćenog zahtjeva) koriste `test.skip` ako uvjet nije ispunjen.
- Limiti i financijsko praćenje su implementirani i pokriveni kroz unit, API integracijske i e2e testove; preciznija analitika po stavci ostaje izvan trenutnog opsega jer se iznos vodi na razini zahtjeva.
- Notifikacije nisu perzistentne, prikazuju se samo kroz UI u aktivnoj sesiji.
