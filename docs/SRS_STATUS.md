# SRS status implementacije

Ovaj dokument mapira zahtjeve iz specifikacije na trenutno stanje aplikacije.
Status je procijenjen prema kodu u repozitoriju, a ne prema potpunom end-to-end testiranju u pregledniku.

## Legenda

| Status | Značenje |
|---|---|
| Implementirano | Funkcionalnost je pokrivena u aplikaciji. |
| Djelomično | Postoji dio funkcionalnosti, ali ne pokriva cijeli zahtjev iz SRS-a. |
| Nije implementirano | Funkcionalnost nije pronađena u trenutnoj implementaciji. |
| Odgođeno | Svjesno se ostavlja za kasniju fazu. |

## Sažetak

| Područje | Procjena | Napomena |
|---|---:|---|
| Korisnici i autentikacija | 45% | Prijava radi, ali nema admin kreiranja korisnika ni registracijskog procesa. |
| Šifrarnici i poslovne godine | 20% | Tablice postoje, ali nema admin upravljanja. |
| Kreiranje i upravljanje zahtjevom | 70% | Osnovno kreiranje radi, ali nema drafta, storniranja i limita. |
| Workflow | 65% | Statusni tok postoji, ali nije potpuno usklađen sa SRS-om. |
| Dokumentacija uz zahtjev | 60% | Postoje ponuda i otpremnica; nema narudžbenice, ostalo i šifrarnika tipova. |
| Pregled i filtriranje | 55% | Pregled radi, ali filtriranje je uglavnom client-side i nema serverske paginacije. |
| Financijsko praćenje | 10% | Limiti postoje u bazi, ali se ne koriste u aplikaciji. |
| Evidencija i revizija | 75% | Povijest statusa postoji; zadnji izmjenitelj nije posebno evidentiran na zahtjevu. |
| Notifikacije | 45% | Postoje toast/in-app obavijesti za dio slučajeva, ali ne perzistentni sustav notifikacija. |

Ukupna procjena prema SRS-u: **45-50%**.

Procjena osnovnog MVP workflowa nabave: **70-75%**.

## Detaljna matrica zahtjeva

| ID | Zahtjev | Status | Dokaz / trenutno stanje | Prioritet dorade |
|---|---|---|---|---|
| 1.1 | Registracija korisnika | Nije implementirano | Ne postoji admin API/UI za kreiranje korisnika, privremena šifra ni validacija domene `@veleri.hr`. Postoji samo login. | Visoko |
| 1.2 | Prijava u sustav | Implementirano | `POST /api/auth/login` provjerava email, lozinku, aktivnost korisnika i izdaje JWT token. | Gotovo |
| 1.3 | Korisničke uloge | Djelomično | Baza ima role `Administrator` i `Zaposlenik`; backend ih koristi za pristup. Nema upravljanja ulogama kroz aplikaciju. | Srednje |
| 2.1 | Pokretanje poslovne godine | Nije implementirano | Postoji tablica `FiscalYear`, ali nema API/UI za otvaranje nove godine i kopiranje šifrarnika. | Visoko |
| 2.2 | Uređivanje šifrarnika | Nije implementirano | Postoje samo read-only rute za dohvat aktivnih odjela i kategorija. Nema dodavanja, uređivanja, brisanja ni deaktivacije. | Visoko |
| 2.3 | Zaključavanje prethodne godine | Nije implementirano | `FiscalYear.is_closed` postoji u bazi, ali nema funkcije za zaključavanje godine. | Visoko |
| 2.4 | Pregled prethodnih godina | Djelomično | Zahtjevi imaju fiskalnu godinu, ali nema posebnog pregleda zaključanih godina niti read-only arhive. | Srednje |
| 2.5 | Zabrana brisanja poslovne godine | Djelomično | Aplikacija nema funkciju brisanja poslovne godine, ali nema ni eksplicitno implementirano poslovno pravilo. | Nisko |
| 2.6 | Godišnji limiti | Djelomično | `Department.department_limit` i `ItemCategory.category_limit` postoje u bazi, ali API ih ne koristi u workflowu. | Odgođeno |
| 3.1 | Kreiranje zahtjeva | Implementirano | Djelatnik može kreirati zahtjev. Backend generira broj u formatu `PR-GGGG-XXXX`. | Gotovo |
| 3.2 | Odabir poslovne godine | Djelomično | Frontend dohvaća aktivnu poslovnu godinu. Backend ne provjerava strogo da odjel i kategorije pripadaju istoj godini kao zahtjev. | Srednje |
| 3.3 | Odabir predmeta nabave | Implementirano | Korisnik bira kategoriju/predmet nabave iz `ItemCategory`. | Gotovo |
| 3.4 | Odabir mjesta troška | Implementirano | Korisnik bira odjel/mjesto troška iz `Department`. | Gotovo |
| 3.5 | Unos stavki zahtjeva | Implementirano | Forma omogućuje dinamičko dodavanje stavki s nazivom i količinom. Backend traži barem jednu stavku. | Gotovo |
| 3.6 | Unos iznosa zahtjeva | Djelomično | Iznos postoji kao `total_amount`/`estimated_amount`, ali nije uvijek obavezan i ne utječe na limite. | Srednje |
| 3.7 | Napomena | Djelomično | Postoji `justification`/svrha nabave, ali nema odvojene slobodne napomene. | Nisko |
| 3.8 | Spremanje nacrta | Nije implementirano | Ne postoji status `Draft` ni spremanje zahtjeva bez slanja. | Srednje |
| 4.1 | Statusi zahtjeva | Djelomično | Podržani su `Poslano`, `Na odobrenju`, `Vraćeno`, `Odbijeno`, `Naručeno`, `Zatvoreno`. Status `Odobreno` postoji u bazi, ali se ne koristi u trenutnom workflowu. | Srednje |
| 4.2 | Poslano | Djelomično | Novi zahtjev odmah dobiva status `Poslano`. Ne oduzima se od limita i ponuda nije uvijek obavezna za slanje. | Srednje |
| 4.3 | Obrada zahtjeva | Djelomično | Admin može preuzeti zahtjev u `Na odobrenju`. Nema statusa `U obradi` kao zasebnog naziva i nema narudžbenice. | Srednje |
| 4.4 | Vraćanje na dopunu | Implementirano | Admin može vratiti zahtjev na dopunu uz komentar, a djelatnik vidi obavijest/alert. | Gotovo |
| 4.5 | Zatvaranje zahtjeva | Djelomično | Samo admin može zatvoriti zahtjev. Backend traži iznos, otpremnicu i dodatno ponudu. Zatvoreni zahtjev je zaključan za izmjene. | Srednje |
| 4.6 | Storniranje zahtjeva | Nije implementirano | Nema statusa ni akcije za storniranje/cancel. | Srednje |
| 5.1 | Vrste dokumenata | Djelomično | Podržani su `Ponuda` i `Otpremnica`. Nema `Narudžbenica`, `Ostalo` ni šifrarnika tipova dokumenata. | Srednje |
| 5.2 | Dodavanje ponude | Djelomično | Djelatnik/admin mogu dodati ponudu. Kod kreiranja je ponuda obavezna samo ako korisnik odabere opciju da ima ponudu. | Srednje |
| 5.3 | Dodavanje narudžbenice | Nije implementirano | Nema tipa dokumenta `Narudžbenica` ni pravila za admin upload u obradi. | Nisko |
| 5.4 | Dodavanje otpremnice | Implementirano | Otpremnica se može dodati u statusu `Naručeno` i uvjet je za zatvaranje. | Gotovo |
| 5.5 | Brisanje dokumenata | Implementirano | Dokumenti se mogu brisati prema pravilima role/statusa; zaključani statusi ne dopuštaju brisanje. | Gotovo |
| 5.6 | Pregled dokumenata | Implementirano | Detalji zahtjeva prikazuju dokumente na jednom mjestu. | Gotovo |
| 5.7 | Dozvoljeni formati | Djelomično | Limit 10 MB postoji. Dopušteni su i formati širi od SRS-a: Excel, TXT i ZIP. | Nisko |
| 6.1 | Pregled vlastitih zahtjeva | Implementirano | Zaposlenik kroz backend vidi samo zahtjeve koje je kreirao. | Gotovo |
| 6.2 | Pregled svih zahtjeva | Implementirano | Administrator kroz backend vidi sve zahtjeve. | Gotovo |
| 6.3 | Pretraživanje i filtriranje | Djelomično | Frontend ima pretragu i filtere po statusu, odjelu i korisniku. Nema filtera po poslovnoj godini i predmetu nabave; filtriranje nije serversko. | Srednje |
| 6.4 | Paginacija | Djelomično | Quasar tablica ima client-side paginaciju. SRS traži serversku paginaciju s 10 zahtjeva po stranici. | Srednje |
| 7.1 | Praćenje limita | Nije implementirano | Nema evidentiranja potrošnje po predmetu nabave i mjestu troška. | Odgođeno |
| 7.2 | Pregled potrošnje | Nije implementirano | Nema admin pregleda potrošnje po šifrarnicima. | Odgođeno |
| 7.3 | Prekoračenje limita | Nije implementirano | Nema upozorenja administratoru kod prekoračenja limita. | Odgođeno |
| 7.4 | Analitički pregled | Nije implementirano | Postoji osnovni dashboard, ali ne analitički pregled zahtjeva i potrošnje po SRS-u. | Odgođeno |
| 8.1 | Datum kreiranja | Implementirano | `PurchaseRequest.created_at` automatski bilježi kreiranje. | Gotovo |
| 8.2 | Datum zadnje izmjene | Djelomično | `updated_at` postoji, ali ne postoji zasebno polje `updated_by_user`. Dio informacija je u povijesti statusa. | Nisko |
| 8.3 | Povijest radnji | Implementirano | `RequestStatusHistory` zapisuje promjene statusa, korisnika, vrijeme i komentar; prikaz postoji na detalju zahtjeva. | Gotovo |
| 9.1 | Obavijest o potrebi dopune | Djelomično | Djelatnik vidi alert/toast za vraćene zahtjeve. Nema perzistentne tablice notifikacija. | Srednje |
| 9.2 | Obavijest o promjeni statusa | Djelomično | Postoje obavijesti za neke akcijske statuse, ali ne za svaku promjenu statusa zahtjeva. | Srednje |

## Preporučeni redoslijed dorada

Limiti se namjerno ostavljaju za kraj jer ovise o poslovnim godinama, šifrarnicima, statusima i storniranju.

1. Uskladiti README i dokumentaciju sa stvarnim stanjem projekta.
2. Dodati admin upravljanje korisnicima i validaciju `@veleri.hr`.
3. Dodati poslovne godine: listanje, otvaranje nove godine, zaključavanje.
4. Dodati šifrarnike: mjesta troška i predmeti nabave, s deaktivacijom korištenih zapisa.
5. Dodati provjeru da zahtjev, mjesto troška i predmet nabave pripadaju istoj poslovnoj godini.
6. Dodati draft i storniranje.
7. Proširiti dokumente: `Narudžbenica`, `Ostalo`, eventualno šifrarnik tipova dokumenata.
8. Dodati serversku paginaciju i filtere.
9. Doraditi notifikacije i audit.
10. Na kraju implementirati limite, potrošnju, prekoračenja i analitiku.

## Napomene za dokumentaciju

- Trenutni projekt se može opisati kao MVP aplikacija za digitalizaciju osnovnog procesa zahtjeva za nabavu.
- Nije dobro tvrditi da su poslovne godine, šifrarnici i limiti potpuno implementirani.
- Financijsko praćenje limita treba opisati kao planiranu doradu ili budući rad dok se ne implementira.
- Status `Na odobrenju` u trenutnom kodu funkcionalno predstavlja fazu obrade, ali naziv nije potpuno isti kao `U obradi` iz SRS-a.
- Status `Odobreno` postoji u bazi kao stariji status, ali trenutni workflow prelazi iz `Na odobrenju` u `Naručeno`.
