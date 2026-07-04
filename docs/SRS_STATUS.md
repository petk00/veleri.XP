# SRS status implementacije

Ovaj dokument mapira zahtjeve iz specifikacije na trenutno stanje aplikacije.
Status je procijenjen prema kodu u repozitoriju, a ne prema potpunom end-to-end testiranju u pregledniku.

Zadnja provjera: **2026-06-11**

Provjereni izvori:

- backend rute u `server/src/routes`,
- frontend stranice u `client/src/pages`,
- dokumentacija u `docs`,
- SQL dump u `database/dump-XP-202605061957.sql`.

## Legenda

| Status | Značenje |
|---|---|
| Implementirano | Funkcionalnost je pokrivena u aplikaciji. |
| Djelomično | Postoji dio funkcionalnosti, ali ne pokriva cijeli zahtjev iz SRS-a. |
| Nije implementirano | Funkcionalnost nije pronađena u trenutnoj implementaciji. |
| Odgođeno | Svjesno se ostavlja za kasniju fazu. |
| Izvan opsega | Svjesna odluka da se zahtjev ne implementira u ovom projektu. |

## Sažetak

| Područje | Procjena | Napomena |
|---|---:|---|
| Korisnici i autentikacija | 95% | Prijava, odjava, invite link, postavljanje lozinke, admin CRUD korisnika. |
| Šifrarnici i poslovne godine | 90% | Admin upravljanje godinama, odjelima i kategorijama; kopiranje šifrarnika. |
| Kreiranje i upravljanje zahtjevom | 85% | Kreiranje, pregled, uređivanje, storno implementirani; draft izvan opsega. |
| Workflow | 90% | Svi statusni prijelazi implementirani uključujući storno i vrati-u-obradu. |
| Dokumentacija uz zahtjev | 100% | Ponuda i otpremnica s pravilima po statusima; narudžbenica i Ostalo izvan opsega projekta. |
| Pregled i filtriranje | 95% | Serverska paginacija, filteri po godini/kategoriji/statusu/odjelu/korisniku/pretrazi. |
| Financijsko praćenje | 10% | Limiti postoje u bazi, ali se ne koriste u aplikaciji. |
| Evidencija i revizija | 80% | Povijest radnji postoji; zadnji izmjenitelj vidljiv kroz historiju. |
| Notifikacije | 92% | In-app obavijesti za sve relevantne promjene statusa; email out of scope. |
| Sigurnost | 90% | httpOnly cookie, CORS whitelist, rate limiting, Helmet, path traversal zaštita. |

Ukupna procjena prema SRS-u: **~87%**.

Procjena MVP workflowa nabave: **~95%**.

## Najvažnije nedovršene cjeline

1. Financijski limiti, potrošnja i analitika nisu implementirani.
2. Produkcijski deployment nije dokumentiran (nema Docker ni instalacijske skripte).

## Detaljna matrica zahtjeva

| ID | Zahtjev | Status | Dokaz / trenutno stanje | Prioritet dorade |
|---|---|---|---|---|
| 1.1 | Registracija korisnika | Implementirano | Admin kreira korisnika kroz `/api/users`; sustav generira invite token; korisnik postavlja lozinku putem linka `/set-password`. | Gotovo |
| 1.2 | Prijava u sustav | Implementirano | `POST /api/auth/login` provjerava email, lozinku i aktivnost korisnika; JWT se postavlja kao httpOnly cookie. | Gotovo |
| 1.3 | Korisničke uloge | Implementirano | Baza ima role `Administrator` i `Zaposlenik`; backend ih koristi za sve provjere pristupa; admin može upravljati ulogama kroz UsersPage. | Gotovo |
| 2.1 | Pokretanje poslovne godine | Implementirano | `POST /api/fiscal-years` otvara novu godinu i kopira šifrarnike iz prethodne; dostupno kroz FiscalYearPage. | Gotovo |
| 2.2 | Uređivanje šifrarnika | Implementirano | CRUD za odjele i kategorije po godini dostupan adminu kroz FiscalYearPage i `/api/fiscal-years/:id/departments|categories`. | Gotovo |
| 2.3 | Zaključavanje prethodne godine | Implementirano | `PATCH /api/fiscal-years/:id/close` zaključava godinu; zaključana godina ne dopušta izmjene šifrarnika. | Gotovo |
| 2.4 | Pregled prethodnih godina | Implementirano | FiscalYearPage prikazuje sve godine s oznakom otvorena/zatvorena. | Gotovo |
| 2.5 | Zabrana brisanja poslovne godine | Implementirano | API nema rutu za brisanje poslovne godine; funkcionalno pravilo je prisutno. | Gotovo |
| 2.6 | Godišnji limiti | Nije implementirano | `department_limit` i `category_limit` postoje u bazi, ali API ih ne koristi u workflowu. | Odgođeno |
| 3.1 | Kreiranje zahtjeva | Implementirano | Djelatnik može kreirati zahtjev. Backend generira broj u formatu `PR-GGGG-XXXX`. | Gotovo |
| 3.2 | Odabir poslovne godine | Implementirano | Frontend dohvaća aktivnu poslovnu godinu. Backend provjerava da odabrani odjel i sve kategorije stavki pripadaju poslovnoj godini zahtjeva (transakcijska provjera i kod kreiranja i kod uređivanja). | Gotovo |
| 3.3 | Odabir predmeta nabave | Implementirano | Korisnik bira kategoriju/predmet nabave iz `ItemCategory`. | Gotovo |
| 3.4 | Odabir mjesta troška | Implementirano | Korisnik bira odjel/mjesto troška iz `Department`. | Gotovo |
| 3.5 | Unos stavki zahtjeva | Implementirano | Forma omogućuje dinamičko dodavanje stavki s nazivom i količinom. Backend traži barem jednu stavku. | Gotovo |
| 3.6 | Unos iznosa zahtjeva | Djelomično | Iznos je obavezan za zatvaranje zahtjeva; ne utječe na limite. | Nisko |
| 3.7 | Napomena | Djelomično | Postoji `justification`/svrha nabave, ali nema odvojene slobodne napomene. | Nisko |
| 3.8 | Spremanje nacrta | Izvan opsega | Draft zahtjeva svjesno nije implementiran. Zahtjev se odmah šalje u obradu. | — |
| 4.1 | Statusi zahtjeva | Implementirano | Podržani su `Poslano`, `Na odobrenju`, `Vraćeno`, `Odbijeno`, `Naručeno`, `Zatvoreno`. Status `Odobreno` postoji u bazi kao stari zapis, ali se ne koristi. | Gotovo |
| 4.2 | Poslano | Implementirano | Novi zahtjev odmah dobiva status `Poslano`; admin prima in-app obavijest. | Gotovo |
| 4.3 | Obrada zahtjeva | Djelomično | Admin može preuzeti zahtjev u `Na odobrenju` i ponovo ga preuzeti iz `Vraćeno` akcijom `vrati-u-obradu`. Nema tipa dokumenta `Narudžbenica`. | Nisko |
| 4.4 | Vraćanje na dopunu | Implementirano | Admin može vratiti zahtjev na dopunu uz komentar; djelatnik prima in-app obavijest. | Gotovo |
| 4.5 | Zatvaranje zahtjeva | Implementirano | Admin zatvara zahtjev; backend traži iznos, ponudu i otpremnicu. Zatvoreni zahtjev je zaključan za izmjene. | Gotovo |
| 4.6 | Storniranje zahtjeva | Implementirano | Admin može stornirati zahtjev u bilo kojem aktivnom statusu (osim Zatvoreno) kroz akciju `storno`. | Gotovo |
| 5.1 | Vrste dokumenata | Implementirano | Podržani su `Ponuda` i `Otpremnica` s pravilima po statusima. Tipovi `Narudžbenica` i `Ostalo` svjesno su izostavljeni iz opsega projekta. | Gotovo |
| 5.2 | Dodavanje ponude | Implementirano | Djelatnik/admin mogu dodati ponudu u statusima Poslano, Na odobrenju, Vraćeno, Naručeno (za edge case). | Gotovo |
| 5.3 | Dodavanje narudžbenice | Odgođeno | Tip dokumenta `Narudžbenica` izvan je opsega projekta — svjesno odlučeno. | — |
| 5.4 | Dodavanje otpremnice | Implementirano | Otpremnica se može dodati u statusu `Naručeno` i uvjet je za zatvaranje. | Gotovo |
| 5.5 | Brisanje dokumenata | Implementirano | Dokumenti se mogu brisati prema pravilima role/statusa; zaključani statusi ne dopuštaju brisanje. | Gotovo |
| 5.6 | Pregled dokumenata | Implementirano | Detalji zahtjeva prikazuju dokumente s mogućnošću preuzimanja. | Gotovo |
| 5.7 | Dozvoljeni formati | Djelomično | Limit 10 MB po datoteci. Dozvoljeni: PDF, DOCX, XLSX, JPG, PNG, ZIP. Stari DOC/XLS i TXT su isključeni jer magic-bytes provjera (`file-type`) ne može verificirati te formate — svjesno odstupanje od SRS-a (koji navodi i DOC) u korist sigurnosti; XLSX i ZIP su prošireni formati. | Nisko |
| 6.1 | Pregled vlastitih zahtjeva | Implementirano | Zaposlenik kroz backend vidi samo zahtjeve koje je kreirao. | Gotovo |
| 6.2 | Pregled svih zahtjeva | Implementirano | Administrator kroz backend vidi sve zahtjeve. | Gotovo |
| 6.3 | Pretraživanje i filtriranje | Implementirano | Serverski filteri po statusu, odjelu, korisniku, poslovnoj godini, predmetu nabave i tekstu pretrage. | Gotovo |
| 6.4 | Paginacija | Implementirano | Serverska paginacija s 10 zahtjeva po stranici. | Gotovo |
| 7.1 | Praćenje limita | Djelomično | Godišnji budžet i limiti po odjelu (mjestu troška) unose se na stranici Financije; potrošnja po odjelu računa se iz zahtjeva u statusima Naručeno/Zatvoreno. Nema praćenja po predmetu nabave. | Srednje |
| 7.2 | Pregled potrošnje | Djelomično | Stranica Financije prikazuje potrošnju i preostali budžet po odjelu za odabranu poslovnu godinu. Nema pregleda po kategorijama artikala. | Srednje |
| 7.3 | Prekoračenje limita | Implementirano | Dijalog odobravanja prikazuje adminu potrošnju, limit i projekciju nakon odobrenja s upozorenjem kod prekoračenja (ne blokira); prekoračenje se automatski bilježi u povijest aktivnosti. | Gotovo |
| 7.4 | Analitički pregled | Nije implementirano | Postoji osnovni dashboard i pregled budžeta po odjelima, ali ne analitički pregled zahtjeva i potrošnje po SRS-u. | Odgođeno |
| 8.1 | Datum kreiranja | Implementirano | `PurchaseRequest.created_at` automatski bilježi kreiranje. | Gotovo |
| 8.2 | Datum zadnje izmjene | Djelomično | `updated_at` postoji; zadnji izmjenitelj vidljiv kroz `RequestStatusHistory`. | Nisko |
| 8.3 | Povijest radnji | Implementirano | `RequestStatusHistory` zapisuje promjene statusa, korisnika, vrijeme i komentar; prikaz postoji na detalju zahtjeva. | Gotovo |
| 9.1 | Obavijest o potrebi dopune | Implementirano | Djelatnik prima in-app obavijest (toast) pri svakom povratku zahtjeva na dopunu. | Gotovo |
| 9.2 | Obavijest o promjeni statusa | Implementirano | In-app obavijesti implementirane za: Vraćeno, Odbijeno, Na odobrenju, Naručeno, Zatvoreno. | Gotovo |

## Preporučeni redoslijed dorada

Preostale dorade, poredane po prioritetu:

1. Proširiti praćenje potrošnje na predmete nabave (po mjestu troška postoji).
3. Dodati administrativni analitički pregled potrošnje.
4. Dodati tip dokumenta `Narudžbenica`.
5. Dodati tip dokumenta `Ostalo`.
6. Proširiti e2e testove na workflow akcije storno, naruči i zatvori te na upload dokumenata (unit i osnovni e2e testovi postoje, CI je postavljen).
7. Pripremiti produkcijski deployment (instalacijska skripta, SSL).

## Napomene za dokumentaciju

- Trenutni projekt se može opisati kao MVP aplikacija za digitalizaciju osnovnog procesa zahtjeva za nabavu.
- Poslovne godine i šifrarnici su implementirani; financijsko praćenje je djelomično — budžeti i potrošnja po odjelu postoje (stranica Financije), ali workflow zahtjeva još ne provjerava limite niti postoji potrošnja po predmetu nabave.
- Status `Na odobrenju` u trenutnom kodu funkcionalno predstavlja fazu obrade, ali naziv nije potpuno isti kao `U obradi` iz SRS-a.
- Status `Odobreno` postoji u bazi kao stariji status, ali trenutni workflow prelazi iz `Na odobrenju` u `Naručeno`.
- Dozvoljeni formati dokumenata odstupaju od SRS-a u oba smjera: prošireni su XLSX-om i ZIP-om, a isključeni su stari DOC/XLS i TXT jer njihove magic bytes nije moguće pouzdano verificirati (sigurnosna provjera stvarnog sadržaja datoteke). Frontend `accept` liste i backend whitelist su usklađeni.
