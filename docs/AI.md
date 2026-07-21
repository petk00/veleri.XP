# AI prijedlozi

## Arhitektura – dvije verzije sustava

Sustav će biti razvijen u dvije paralelne verzije radi usporedbe cloud i on-premise AI pristupa.

### Verzija A – Cloud/API

- Sustav hostan na VPS-u.
- AI funkcionalnosti koriste vanjski API (OpenAI, Claude ili sličan pružatelj usluge).
- Obrada se izvršava na infrastrukturi pružatelja AI usluge.
- Prednosti:
  - vrlo dobra kvaliteta odgovora
  - nema potrebe za lokalnim GPU hardverom
  - jednostavno skaliranje
  - jednostavnije održavanje modela
- Nedostaci:
  - trošak po pozivu
  - ovisnost o internetskoj vezi
  - podaci se šalju trećoj strani
  - moguće promjene cijena ili dostupnosti API-ja

---

### Verzija B – Lokalni LLM (On-Premise)

- Sustav se izvršava na Mac Mini M4 (16 GB Unified Memory).
- LLM radi lokalno putem Ollama platforme.
- Predviđeni modeli:
  - Qwen2.5 7B
  - Qwen3 8B
  - Gemma 3
  - drugi modeli koji se pokažu pogodnima tijekom istraživanja
- Sustav će biti javno dostupan putem domene i Cloudflare Tunnel-a bez potrebe za port forwardingom.
- Prednosti:
  - potpuna privatnost podataka
  - nema API troškova
  - potpuna kontrola nad modelom
  - moguć rad bez internetske veze (osim pristupa aplikaciji)
- Nedostaci:
  - ograničene performanse zbog lokalnog hardvera
  - potrebno održavanje lokalnog modela
  - kvaliteta odgovora ovisi o mogućnostima manjeg modela

---

### Komparativna analiza

Za obje implementacije mjerit će se:

- prosječna latencija odgovora
- vrijeme obrade pojedinog zadatka
- iskorištenost memorije i procesora
- kvaliteta odgovora
- točnost ekstrakcije podataka
- ukupni trošak korištenja
- privatnost podataka
- jednostavnost implementacije
- mogućnost daljnjeg razvoja

Cilj rada nije dokazati da je jedan pristup univerzalno bolji od drugoga, već odrediti koji je prikladniji za sustav elektroničke nabave u akademskom okruženju.

---

# Primarni fokus istraživanja

## AI ekstrakcija podataka iz dokumenata

Ovo predstavlja glavni AI dio diplomskog rada te će biti implementiran u obje verzije sustava.

### Opis funkcionalnosti

Korisnik prilikom izrade zahtjeva za nabavu prilaže dokument poput:

- ponude
- predračuna
- računa
- otpremnice
- specifikacije proizvoda

Nakon učitavanja dokumenta AI automatski pokušava izdvojiti strukturirane informacije.

Primjeri:

- naziv dobavljača
- OIB dobavljača (ako postoji)
- broj dokumenta
- datum izdavanja
- datum valjanosti ponude
- ukupni iznos
- valuta
- PDV
- pojedine stavke
- količine
- jedinične cijene
- kratki opis dokumenta

Dobiveni podaci automatski popunjavaju obrazac zahtjeva za nabavu, dok korisnik može pregledati i po potrebi ispraviti rezultate.

---

### Evaluacija

Za potrebe istraživanja pripremit će se skup testnih dokumenata.

Za svaki dokument ručno će biti definirani točni ("ground truth") podaci.

Mjerit će se:

- Precision
- Recall
- F1 Score
- postotak potpuno ispravno prepoznatih polja
- vrijeme obrade
- prosječna latencija
- cijena obrade jednog dokumenta
- uspješnost lokalnog modela u odnosu na API

Time se dobiva objektivna usporedba obje arhitekture.

---

# Ostale AI funkcionalnosti

## 1. AI asistent za kreiranje zahtjeva

Korisnik umjesto ručnog ispunjavanja obrasca može opisati potrebu prirodnim jezikom.

Primjer:

> "Trebaju nam tri nova monitora za računalni laboratorij."

AI zatim predlaže:

- naziv zahtjeva
- kategoriju nabave
- procijenjenu vrstu opreme
- moguće stavke
- količine
- kratko obrazloženje
- prioritet zahtjeva

Dodatno:

- detekcija mogućih duplikata
- prijedlog postojećih sličnih zahtjeva
- prijedlog prethodno korištenih artikala

Cilj:

- smanjiti vrijeme unosa
- standardizirati zahtjeve
- smanjiti broj pogrešaka

---

## 2. AI Summary za administratora

Administrator prilikom pregleda zahtjeva dobiva automatski generirani sažetak.

Primjer:

- što se nabavlja
- za koju svrhu
- procijenjena vrijednost
- zašto je zahtjev otvoren
- postoje li nejasnoće
- postoje li mogući rizici

Administrator više ne mora čitati cijeli opis prije prve procjene.

---

## 3. AI Chat pomoćnik (Function Calling)

Umjesto klasičnog chata koristi se ograničeni skup funkcija.

Model nema direktan pristup bazi podataka.

Backend izvršava stvarne akcije.

Primjeri:

- "Koji je status mog zahtjeva?"
- "Koliko mi je ostalo budžeta?"
- "Prikaži moje otvorene zahtjeve."
- "Ponovi zadnji zahtjev."
- "Koji zahtjevi čekaju moje odobrenje?"
- "Koji su dokumenti priloženi ovom zahtjevu?"
- "Što još nedostaje za završetak zahtjeva?"

AI samo odlučuje koju funkciju treba pozvati.

Time se značajno smanjuje mogućnost halucinacije.

---

## 4. Prirodni jezik → pretraga

Administrator može koristiti običan hrvatski jezik umjesto ručnog filtriranja.

Primjeri:

- pokaži zahtjeve iznad 500 €
- pokaži sve zahtjeve koji čekaju dulje od tjedan dana
- pronađi sve zahtjeve Fakulteta informatike
- pokaži odbijene zahtjeve ovog mjeseca
- pronađi sve zahtjeve dobavljača X

LLM prevodi korisnički upit u postojeće filtere aplikacije.

---

## 5. AI preporuka pri odobravanju

Na temelju:

- povijesti sličnih zahtjeva
- priloženih dokumenata
- iznosa
- kategorije
- dobavljača

AI može dati preporuku administratoru.

Primjeri:

- nizak rizik
- srednji rizik
- potrebno dodatno obrazloženje
- preporuka za povrat na doradu
- neuobičajeno visok iznos
- sličan zahtjev već postoji

Važno:

AI nikada ne donosi odluku.

Administrator uvijek potvrđuje ili odbija zahtjev.

---

## 6. AI detekcija anomalija

Sustav može prepoznavati neuobičajene obrasce.

Primjeri:

- nagli rast troškova
- često prekoračenje limita
- neuobičajeno veliki pojedinačni iznosi
- neuobičajena potrošnja pojedinog odjela
- veliki broj zahtjeva istog dobavljača u kratkom razdoblju

Cilj nije automatsko blokiranje zahtjeva nego rano upozoravanje administratora.

---

## 7. AI pomoć pri pisanju odgovora

Administrator često vraća zahtjeve na doradu.

AI može generirati profesionalnu poruku.

Primjeri:

- zahtjev nije dovoljno obrazložen
- nedostaje ponuda
- potrebno dopuniti stavke
- potrebno priložiti dodatnu dokumentaciju

Time se postiže ujednačen način komunikacije prema zaposlenicima.

---

## 8. AI klasifikacija dokumenata

Prilikom učitavanja dokumenta AI može automatski prepoznati vrstu dokumenta.

Primjeri:

- ponuda
- račun
- predračun
- otpremnica
- katalog
- tehnička specifikacija

Time se može automatski odabrati odgovarajući način ekstrakcije podataka.

---

## 9. AI provjera potpunosti zahtjeva

Prije slanja zahtjeva AI može provjeriti postoje li nedostaci.

Primjeri:

- nedostaje obrazloženje
- nedostaje dokument
- nije odabrana kategorija
- nije navedena količina
- nedostaje procijenjeni trošak

Cilj je smanjiti broj zahtjeva koji se vraćaju na doradu.

---

# Tehnički pristup razvoju AI dijela

Plan razvoja temelji se na modernim LLM tehnikama bez potrebe za treniranjem vlastitog modela.

Koristit će se:

- prompt engineering
- structured output
- function calling
- JSON schema validacija
- RAG (po potrebi)
- embedding modeli za pretraživanje
- logiranje AI poziva
- evaluacijski skup testnih podataka

Fine-tuning nije planiran kao primarna metoda.

Može se navesti kao moguće buduće proširenje rada (LoRA / QLoRA), ali nije nužan za ostvarenje ciljeva istraživanja.

---

# Evaluacija AI sustava

Za svaku AI funkcionalnost vodit će se evidencija:

- korišteni model
- verzija modela
- trajanje izvršavanja
- broj tokena (API)
- cijena poziva
- iskorištenost memorije
- kvaliteta odgovora
- broj pogrešaka
- korisničke ispravke

Na temelju prikupljenih podataka moguće je izraditi detaljnu usporedbu cloud i lokalnog pristupa.

---

# Buduća proširenja

Moguće nadogradnje koje nisu dio osnovnog diplomskog rada:

- multimodalni modeli za OCR i analizu tablica
- glasovni AI pomoćnik
- automatsko prepoznavanje dobavljača iz povijesti
- predviđanje buduće potrošnje pomoću ML modela
- automatsko grupiranje sličnih zahtjeva
- napredna analitika i AI dashboard
- fine-tuning lokalnog modela
- integracija s ERP sustavima

---

# Prioritet implementacije (Core set)

## Obavezno

1. **AI ekstrakcija podataka iz dokumenata (glavni dio istraživanja)**
2. **Cloud vs. Lokalni LLM usporedba**
3. **AI asistent za kreiranje zahtjeva**
4. **AI Summary za administratora**
5. **Constrained AI Chat (Function Calling)**

---

## Ako vrijeme dopusti

6. Prirodni jezik → pretraga
7. AI preporuka pri odobravanju
8. AI klasifikacija dokumenata
9. AI provjera potpunosti zahtjeva
10. AI detekcija anomalija
11. AI pomoć pri pisanju odgovora

---

# Završni cilj diplomskog rada

Razviti sustav elektroničke nabave koji koristi umjetnu inteligenciju za automatizaciju poslovnih procesa te kroz objektivnu usporedbu cloud i lokalnog LLM pristupa analizirati njihove prednosti, nedostatke, troškove, performanse, privatnost i praktičnu primjenjivost u stvarnom informacijskom sustavu.