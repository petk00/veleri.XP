# AI prijedlozi

## Arhitektura – dvije verzije sustava

Sustav će biti razvijen u dvije paralelne verzije radi usporedbe cloud vs. on-premise pristupa:

- **Verzija A – Cloud/API**: sustav hostan na serveru (VPS), AI funkcionalnosti koriste plaćeni API (Claude, OpenAI i sl.)
- **Verzija B – Lokalni LLM**: sustav vrti se na Mac Mini M4 (16GB, unified memory), lokalni model (npr. Qwen2.5 7B / Qwen3.5 9B) preko Ollama, javno dostupan putem domene i Cloudflare Tunnel (bez port forwardinga)

Za obje verzije mjerit će se:
- performanse (brzina odgovora, latencija)
- točnost/kvaliteta odgovora (ekstrakcija polja spram ground truth skupa)
- troškovi (API cijena po pozivu vs. trošak lokalne infrastrukture i struje)
- privatnost podataka (lokalna obrada vs. slanje trećoj strani)

Cilj: usporediti isplativost i praktičnost cloud vs. on-premise AI pristupa u kontekstu diplomskog rada.

## Primarni fokus: AI ekstrakcija podataka iz dokumenata

Ovo je nosivi dio istraživanja i glavna AI funkcionalnost sustava.

- Korisnik dodaje dokument (ponuda, otpremnica) kroz sučelje.
- Sustav automatski prepoznaje:
  - naziv dobavljača
  - ukupni iznos
  - datum izdavanja
  - ključne stavke/informacije iz dokumenta
- Implementira se u obje verzije (API i lokalni model) radi izravne usporedbe.
- Za evaluaciju: definirati skup test dokumenata s ručno označenim ("ground truth") podacima, mjeriti točnost ekstrakcije, brzinu odgovora i trošak po obradi za oba pristupa.
- Cilj: smanjiti ručni unos, povećati točnost podataka i dobiti mjerljivu usporedbu cloud vs. lokalnog pristupa za konkretnu poslovnu zadaću.

## Ostale predložene AI funkcionalnosti

### 1. AI asistent za kreiranje zahtjeva
- Korisnik unosi kratak opis potrebe slobodnim tekstom.
- Sustav predlaže naziv zahtjeva, kategoriju nabave, moguće stavke, kratku napomenu.
- Dodatno: detekcija mogućih duplikata (postojeći sličan otvoren zahtjev).
- Cilj: smanjiti vrijeme unosa i standardizirati zahtjeve.

### 2. AI summary za admin pregled
- Za svaki zahtjev generira se kratak sažetak: što se traži, zašto je potrebno, koji su potencijalni rizici ili nedostaci.
- Cilj: ubrzati obradu i smanjiti potrebu za ručnim čitanjem cijelog obrasca.

### 3. Constrained AI chat/pomoćnik (function calling / tool use)
- Zatvoren set naredbi koje LLM prepoznaje i poziva kroz definirane funkcije (backend izvršava, model ne dira bazu direktno), npr.:
  - "ponovi zadnji zahtjev sličan onome koji sam napravio" → dohvat i predlaganje na temelju povijesti
  - "koji je status mog zahtjeva"
  - "koliko mi je preostalo budžeta"
  - "što mi nedostaje da zatvorim zahtjev"
- Cilj: jednostavnija navigacija i podrška korisniku uz nizak rizik od halucinacije/pogrešne radnje, izvedivo i na manjem lokalnom modelu (7B klasa).

### 4. Prirodni jezik → pretraga/filter (admin)
- Primjer: "pokaži mi sve zahtjeve iznad 500€ koji čekaju odobrenje dulje od tjedan dana"
- Sustav prevodi upit u filtere nad admin tablicom.
- Cilj: brža navigacija bez ručnog podešavanja filtera.

### 5. AI preporuka pri odobravanju zahtjeva
- Na temelju povijesti sličnih zahtjeva sustav predlaže razinu rizika, potrebu dodatne provjere, treba li zahtjev vratiti na dopunu.
- Prijedlog je isključivo savjetodavan – admin i dalje donosi odluku.
- Cilj: podrška administratoru bez promjene osnovnog workflowa.

### 6. AI detekcija anomalija u financijama
- Sustav prati neočekivano visoke iznose, česta prekoračenja limita, neuobičajene obrasce potrošnje po odjelima/kategorijama.
- Cilj: rano upozoravanje i bolja kontrola budžeta.

### 7. AI pomoć pri formuliranju odbijanja/izmjena
- Admin klikne razlog, AI pomogne sročiti profesionalnu poruku zaposleniku.

## Napomena o pristupu razvoju AI dijela

- Ne planira se fine-tuning modela kao osnovni pristup – koristi se prompt engineering, function calling (structured output) i po potrebi RAG (dohvat konteksta iz baze/vektorske baze).
- Fine-tuning (LoRA/QLoRA) može se navesti kao mogući "proof of concept" ili buduće proširenje, ali nije nužan za ostvarenje cilja rada.
- Za svaku AI funkcionalnost predviđa se osnovni oblik evaluacije/logiranja poziva (prompt, odgovor, točnost, latencija) radi mjerljivosti rezultata.

## Prioritet (core set za diplomski)

1. **AI ekstrakcija podataka iz dokumenata** (API vs. lokalni model – glavna komparativna analiza, nosivi dio istraživanja)
2. AI asistent za kreiranje zahtjeva
3. AI summary za admin pregled
4. Constrained AI chat/pomoćnik (dodatni "wow" faktor, ograničen scope drži ga izvedivim)

*Ostatak (5–7) kao mogući "nice to have" ako vremena bude dovoljno.*