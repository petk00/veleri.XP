# AI prijedlozi

## Predložene AI funkcionalnosti

### 1. AI ekstrakcija podataka iz dokumenata
- Sustav automatski prepoznaje:
  - naziv dobavljača
  - ukupni iznos
  - datum izdavanja
  - ključne informacije iz ponude ili otpremnice
- Cilj: smanjiti ručni unos i povećati točnost podataka.

#### Usporedni pristup (API vs. lokalni model)
Ekstrakcija će biti implementirana u dvije verzije radi usporedbe:
- **Verzija A – API pristup**: korištenje Claude API-a za ekstrakciju podataka iz ponude.
- **Verzija B – lokalni model**: korištenje lokalno pokrenutog modela (Qwen 3.6), dodatno tuniranog za istu zadaću.

Za obje verzije mjerit će se:
- performanse (brzina odgovora)
- točnost ekstrakcije podataka
- troškovi (API troškovi vs. troškovi lokalne infrastrukture)

Cilj: usporediti isplativost i praktičnost cloud vs. on-premise pristupa za ovaj tip zadaće u kontekstu diplomskog rada.

### 2. AI asistent za kreiranje zahtjeva
- Korisnik unosi kratak opis potrebe.
- Sustav predlaže:
  - naziv zahtjeva
  - kategoriju nabave
  - moguće stavke
  - kratku napomenu ili obrazloženje
- Cilj: smanjiti vrijeme unosa i standardizirati zahtjeve.

### 3. AI summary za admin pregled
- Za svaki zahtjev generira se kratak sažetak:
  - što se traži
  - zašto je potrebno
  - koji su potencijalni rizici ili nedostaci
- Cilj: ubrzati obradu i smanjiti potrebu za ručnim čitanjem cijelog obrasca.

### 4. AI detekcija anomalija u financijama
- Sustav prati:
  - neočekivano visoke iznose
  - česta prekoračenja limita
  - neuobičajene obrasce potrošnje po odjelima ili kategorijama
- Cilj: rano upozoravanje i bolja kontrola budžeta.

### 5. AI preporuka pri odobravanju zahtjeva
- Na temelju povijesti i relevantnih podataka sustav predlaže:
  - je li zahtjev niskog, srednjeg ili visokog rizika
  - je li potrebna dodatna provjera
  - treba li zahtjev vratiti na dopunu
- Cilj: podrška administratoru bez promjene osnovnog workflowa.

### 6. AI chat/pomoćnik unutar aplikacije
- Korisnik postavlja pitanja poput:
  - "Koji je status mog zahtjeva?"
  - "Što mi još nedostaje da ga zatvorim?"
  - "Koliki mi je preostali budžet?"
- Cilj: jednostavnija navigacija i bolja korisnička podrška.

## Prioritet

1. AI ekstrakcija podataka iz dokumenata (API vs. lokalni model)
2. AI asistent za kreiranje zahtjeva
3. AI summary za admin pregled
