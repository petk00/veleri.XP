# 📦 veleri.XP.nabava

Početna verzija interne web aplikacije za upravljanje procesom nabave.

Aplikacija je namijenjena digitalizaciji i pojednostavljenju internog postupka nabave kroz evidenciju zahtjeva, upravljanje dokumentacijom i pregled potrošnje po predmetu nabave i mjestu troška.

---

## 🎯 Svrha aplikacije

Cilj aplikacije je uspostaviti jedno centralno mjesto za vođenje zahtjeva za nabavu i povezane dokumentacije, uz bolju preglednost procesa i jednostavniju kontrolu troškova.

Aplikacija omogućuje:

- evidenciju zahtjeva za nabavu
- unos stavki i količina unutar zahtjeva
- povezivanje zahtjeva s predmetom nabave i mjestom troška
- dodavanje ponuda, otpremnica i narudžbenice
- pregled zahtjeva i njihovih statusa
- pregled potrošnje po predmetu nabave
- pregled potrošnje po mjestu troška
- upravljanje godišnjim limitima i poslovnim godinama

---

## 👥 Korisničke uloge

Sustav podržava sljedeće korisničke uloge:

- **Korisnik** – kreira i dopunjuje vlastite zahtjeve za nabavu
- **Administrator** – pregledava sve zahtjeve, upravlja šifrarnicima, godišnjim limitima i zatvara zahtjeve

> Napomena: sustav koristi tablicu `uloga`, što ostavlja mogućnost budućeg proširenja i dodavanja novih korisničkih uloga.

---

## ⚙️ Glavne funkcionalnosti

- registracija korisnika uz dopuštenu domenu e-mail adrese
- prijava u sustav
- kreiranje novog zahtjeva za nabavu
- spremanje zahtjeva u statusu `draft`
- slanje zahtjeva u obradu
- naknadna dopuna zahtjeva iznosom i dokumentacijom
- dodavanje jedne ili više ponuda
- dodavanje jedne ili više otpremnica
- dodavanje jedne narudžbenice od strane administratora
- pregled vlastitih zahtjeva
- pregled svih zahtjeva
- pretraživanje i filtriranje zahtjeva
- upravljanje predmetima nabave
- upravljanje mjestima troška
- upravljanje godišnjim limitima
- pokretanje nove poslovne godine
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

## 🛠️ Tehnologije

Planirana tehnološka osnova aplikacije:

- **Frontend:** Vue.js + Quasar Framework
- **Backend:** Node.js + Express
- **Baza podataka:** MariaDB / MySQL
- **API komunikacija:** REST API

> Točna baza podataka može biti potvrđena tijekom implementacije, ovisno o dostupnom razvojnom okruženju.

---

## 🗂️ Struktura projekta

```text
project-root/
│
├── client/          # frontend aplikacija
├── server/          # API i poslovna logika
├── database/        # SQL skripte, sheme i početni podaci
└── README.md
