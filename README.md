            ▄▄                    ▄▄▄   ▄▄▄ ▄▄▄▄▄▄▄   
            ██             ▀▀     ████▄████ ███▀▀███▄ 
██ ██ ▄█▀█▄ ██ ▄█▀█▄ ████▄ ██      ▀█████▀  ███▄▄███▀ 
██▄██ ██▄█▀ ██ ██▄█▀ ██ ▀▀ ██     ▄███████▄ ███▀▀▀▀   
 ▀█▀  ▀█▄▄▄ ██ ▀█▄▄▄ ██    ██▄ ██ ███▀ ▀███ ███    


# 📦 veleri.XP.nabava

Interna web aplikacija za upravljanje zahtjevima za nabavu.

Aplikacija je namijenjena digitalizaciji i pojednostavljenju internog postupka nabave kroz evidenciju zahtjeva, upravljanje dokumentacijom, praćenje statusa i pregled potrošnje po predmetu nabave i mjestu troška.

![Status](https://img.shields.io/badge/status-u%20razvoju-blue)
![Frontend](https://img.shields.io/badge/frontend-Vue%20%2B%20Quasar-42b883)
![Backend](https://img.shields.io/badge/backend-Node.js%20%2B%20Express-green)
![Database](https://img.shields.io/badge/database-MySQL-orange)
![License](https://img.shields.io/badge/license-educational-lightgrey)

---

## 🎯 Svrha aplikacije

Cilj aplikacije je uspostaviti jedno centralno mjesto za vođenje zahtjeva za nabavu i povezane dokumentacije, uz bolju preglednost procesa, lakše praćenje statusa zahtjeva i jednostavniju kontrolu troškova.

Aplikacija omogućuje:

- evidenciju zahtjeva za nabavu
- unos stavki i količina unutar zahtjeva
- povezivanje zahtjeva s poslovnom godinom, predmetom nabave i mjestom troška
- dodavanje ponuda, otpremnica i narudžbenice
- pregled zahtjeva i njihovih statusa
- pregled potrošnje po predmetu nabave
- pregled potrošnje po mjestu troška
- upravljanje godišnjim limitima i poslovnim godinama
- evidenciju svih važnih radnji nad zahtjevima

---

## 👥 Korisničke uloge

Sustav podržava sljedeće korisničke uloge:

- **Korisnik** – kreira, uređuje i dopunjuje vlastite zahtjeve za nabavu
- **Administrator** – pregledava sve zahtjeve, mijenja statuse, zatvara zahtjeve, upravlja šifrarnicima, poslovnim godinama, limitima i korisnicima

> Sustav koristi tablicu `uloga`, što omogućuje kasnije proširenje i dodavanje novih korisničkih uloga.

---

## ⚙️ Glavne funkcionalnosti

- registracija korisnika
- prijava u sustav
- kreiranje novog zahtjeva za nabavu
- spremanje zahtjeva u statusu `draft`
- slanje zahtjeva u obradu
- naknadna dopuna zahtjeva
- unos ukupnog iznosa i napomene
- dodavanje jedne ili više ponuda
- dodavanje jedne ili više otpremnica
- dodavanje narudžbenice od strane administratora
- pregled vlastitih zahtjeva
- pregled svih zahtjeva
- pretraživanje i filtriranje zahtjeva
- pregled dokumentacije vezane uz zahtjev
- pregled povijesti promjena zahtjeva
- upravljanje predmetima nabave
- upravljanje mjestima troška
- upravljanje godišnjim limitima
- otvaranje nove poslovne godine
- zaključavanje prethodne poslovne godine
- pregled potrošnje po predmetu nabave i mjestu troška
- zatvaranje zahtjeva nakon provjere obvezne dokumentacije

---

## 📌 Statusi zahtjeva

Zahtjev tijekom rada u sustavu može imati sljedeće statuse:

- `draft`
- `poslan`
- `u_obradi`
- `zatvoren`
- `storniran`

---

## 🧠 Poslovna pravila

Aplikacija poštuje nekoliko važnih poslovnih pravila:

- zahtjev, predmet nabave i mjesto troška moraju pripadati istoj poslovnoj godini
- prethodne zaključane poslovne godine ostaju dostupne za pregled, ali ne i za izmjenu
- administrator ima sve ovlasti kao i korisnik, uz dodatne administrativne funkcije
- zahtjev se može zatvoriti samo ako ima obaveznu dokumentaciju
- za zatvaranje zahtjeva moraju postojati najmanje:
  - ponuda
  - otpremnica
- sve važne radnje nad zahtjevom evidentiraju se kroz zapisnik aktivnosti

---

## 🛠️ Tehnologije

Planirana tehnološka osnova aplikacije:

- **Frontend:** Vue.js + Quasar Framework
- **Backend:** Node.js + Express
- **Baza podataka:** MySQL
- **API komunikacija:** REST API

---

## 🧩 Model podataka

Sustav se temelji na sljedećim osnovnim entitetima:

- `uloga`
- `korisnik`
- `poslovna_godina`
- `status_zahtjeva`
- `vrsta_dokumenta`
- `predmet_nabave`
- `mjesto_troska`
- `limit_predmeta`
- `limit_mjesta_troska`
- `zahtjev`
- `stavka_zahtjeva`
- `dokument`
- `evidencija_radnji`

---

## 🚀 Pokretanje projekta

🔐 Početni podaci sustava

Za ispravan rad sustava potrebno je imati unesene sljedeće početne podatke:
	•	korisničke uloge
	•	statuse zahtjeva
	•	vrste dokumenata
	•	početnu poslovnu godinu
	•	administratorskog korisnika
	•	početne predmete nabave i mjesta troška

⸻

🗺️ Roadmap

Planirani daljnji razvoj aplikacije uključuje:
	•	dovršetak backend API sloja
	•	implementaciju autentikacije i autorizacije
	•	izradu korisničkog sučelja za sve glavne funkcionalnosti
	•	upload i pregled dokumenata
	•	prikaz izvještaja o potrošnji
	•	validacije poslovnih pravila u aplikacijskom sloju
	•	dodatne administratorske funkcionalnosti
	•	završno testiranje i doradu korisničkog iskustva

⸻

✅ TODO
	•	postaviti bazu podataka i početne SQL skripte
	•	izraditi REST API za korisnike i prijavu
	•	izraditi REST API za zahtjeve
	•	izraditi upload dokumenata
	•	implementirati statuse zahtjeva
	•	izraditi prikaz potrošnje po predmetu nabave
	•	izraditi prikaz potrošnje po mjestu troška
	•	implementirati otvaranje nove poslovne godine
	•	implementirati zaključavanje poslovne godine
	•	dovršiti frontend prozore i validacije

⸻

📄 Napomena o projektu

Ovaj projekt razvija se u edukativne svrhe kao dio izrade projektnog zadatka i projektne dokumentacije u okviru studija.

Aplikacija je trenutno u fazi projektiranja i postupne implementacije, a planirano je daljnje proširenje funkcionalnosti tijekom razvoja.

⸻

✍️ Autor

Igor Petković
Veleučilište u Rijeci
Stručni diplomski studij Informacijske tehnologije u poslovnim sustavima
Smjer: Programsko inženjerstvo
