# AI prijedlozi

## Arhitektura – dvije verzije sustava

Sustav će biti razvijen u dvije paralelne verzije radi usporedbe cloud vs. on-premise pristupa:

- **Verzija A – Cloud/API**: sustav hostan na serveru (VPS), AI funkcionalnosti koriste plaćeni API (Claude, OpenAI i sl.)
- **Verzija B – Lokalni LLM**: sustav vrti se na Mac Mini M4 (unified memory), lokalni model preko Ollama, javno dostupan putem domene i Cloudflare Tunnel (bez port forwardinga)

Za obje verzije mjerit će se:
- performanse (brzina odgovora, latencija)
- točnost/kvaliteta odgovora
- troškovi (API cijena po pozivu vs. trošak lokalne infrastrukture i struje)
- privatnost podataka (lokalna obrada vs. slanje trećoj strani)

Cilj: usporediti isplativost i praktičnost cloud vs. on-premise AI pristupa u kontekstu diplomskog rada.

## Predložene AI funkcionalnosti

### 1. AI asistent za kreiranje zahtjeva
- Korisnik unosi kratak opis potrebe slobodnim tekstom.
- Sustav predlaže:
  - naziv zahtjeva
  - kategoriju nabave
  - moguće stavke
  - kratku napomenu ili obrazloženje
- Dodatno: detekcija mogućih duplikata (postojeći sličan otvoren zahtjev).
- Cilj: smanjiti vrijeme unosa i standardizirati zahtjeve.

### 2. AI summary za admin pregled
- Za svaki zahtjev generira se kratak sažetak:
  - što se traži
  - zašto je potrebno
  - koji su potencijalni rizici ili nedostaci
- Cilj: ubrzati obradu i smanjiti potrebu za ručnim čitanjem cijelog obrasca.

### 3. Prirodni jezik → pretraga/filter (admin)
- Primjer: "pokaži mi sve zahtjeve iznad 500€ koji čekaju odobrenje dulje od tjedan dana"
- Sustav prevodi upit u filtere nad admin tablicom.
- Cilj: brža navigacija bez ručnog podešavanja filtera.

### 4. AI ekstrakcija podataka iz dokumenata
- Sustav automatski prepoznaje iz ponude/otpremnice:
  - naziv dobavljača
  - ukupni iznos
  - datum izdavanja
  - ključne stavke
- Implementira se u obje verzije (API i lokalni model) radi iste usporedbe kao gore.
- Cilj: smanjiti ručni unos i povećati točnost podataka.

### 5. AI preporuka pri odobravanju zahtjeva
- Na temelju povijesti sličnih zahtjeva sustav predlaže:
  - je li zahtjev niskog, srednjeg ili visokog rizika
  - je li potrebna dodatna provjera
  - treba li zahtjev vratiti na dopunu
- Prijedlog je isključivo savjetodavan – admin i dalje donosi odluku.
- Cilj: podrška administratoru bez promjene osnovnog workflowa.

### 6. AI detekcija anomalija u financijama
- Sustav prati:
  - neočekivano visoke iznose
  - česta prekoračenja limita
  - neuobičajene obrasce potrošnje po odjelima/kategorijama
- Cilj: rano upozoravanje i bolja kontrola budžeta.

### 7. AI chat/pomoćnik unutar aplikacije
- Korisnik postavlja pitanja poput:
  - "Koji je status mog zahtjeva?"
  - "Što mi još nedostaje da ga zatvorim?"
  - "Koliki mi je preostali budžet?"
- Cilj: jednostavnija navigacija i bolja korisnička podrška.

## Prioritet (core set za diplomski)

1. AI asistent za kreiranje zahtjeva
2. AI summary za admin pregled
3. AI ekstrakcija podataka iz dokumenata (API vs. lokalni model – glavna usporedba)

*Ostatak (4–7) kao mogući "nice to have" ako vremena bude dovoljno.*