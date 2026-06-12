# API dokumentacija

Ovaj dokument opisuje REST API aplikacije `veleri.XP`.
API koristi JSON format za većinu zahtjeva i odgovora, osim kod uploada i downloada dokumenata.

## Osnovni podaci

| Stavka | Vrijednost |
|---|---|
| Backend tehnologija | Node.js, Express |
| Osnovni URL lokalno | `http://localhost:3000/api` |
| Autentikacija | JWT httpOnly cookie |
| Format podataka | JSON |
| Upload dokumenata | `multipart/form-data` |

## Autentikacija

Većina API ruta zaštićena je JWT tokenom koji se prenosi kao `httpOnly` cookie.
Cookie postavlja backend pri uspješnoj prijavi; browser ga automatski šalje uz svaki zahtjev.
Frontend koristi `withCredentials: true` u Axios konfiguraciji — nema ručnog dodavanja tokena u headere.

Ako cookie nedostaje, nije ispravan ili je istekao, API vraća status `401`.

## Standardni status kodovi

| Status | Značenje |
|---:|---|
| 200 | Zahtjev je uspješno izvršen. |
| 201 | Resurs je uspješno kreiran. |
| 400 | Neispravan zahtjev ili poslovno pravilo nije zadovoljeno. |
| 401 | Korisnik nije autentificiran. |
| 403 | Korisnik nema ovlasti za akciju. |
| 404 | Resurs nije pronađen. |
| 409 | Konflikt, npr. pri generiranju broja zahtjeva. |
| 500 | Interna greška servera. |

## Auth API

### POST `/api/auth/login`

Prijava korisnika u sustav.

Autentikacija: **nije potrebna**

#### Request body

```json
{
  "email": "korisnik@veleri.hr",
  "password": "lozinka"
}
```

#### Uspješan odgovor

JWT token se ne vraća u tijelu odgovora — postavlja se kao `httpOnly` cookie (`token`).

```json
{
  "message": "Prijava uspješna.",
  "user": {
    "id_user": 2,
    "first_name": "Ivan",
    "last_name": "Horvat",
    "email": "ivan.horvat@veleri.hr",
    "role_name": "Zaposlenik"
  }
}
```

#### Moguće greške

| Status | Razlog |
|---:|---|
| 400 | Email ili lozinka nisu poslani. |
| 401 | Neispravni podaci za prijavu. |
| 403 | Korisnički račun nije aktivan. |
| 500 | Greška pri prijavi. |

## Requests API

Rute za zahtjeve koriste prefiks:

```text
/api/requests
```

Sve rute zahtijevaju JWT token.

### GET `/api/requests`

Dohvaća listu zahtjeva.

Pravila pristupa:

- administrator vidi sve zahtjeve,
- zaposlenik vidi samo zahtjeve koje je sam kreirao.

#### Uspješan odgovor

```json
[
  {
    "id_purchase_request": 1,
    "request_number": "PR-2026-0001",
    "fiscal_year": 2026,
    "department_name": "IT",
    "fk_request_status": 1,
    "created_by": "Ivan Horvat",
    "total_amount": "250.00",
    "created_at": "2026-04-23T21:21:14.000Z",
    "status_name": "Poslano"
  }
]
```

#### Napomena

Trenutna implementacija ne podržava serversku paginaciju ni query filtere.
Filtriranje i paginacija se trenutno rade na frontend strani.

### GET `/api/requests/:id`

Dohvaća detalje pojedinog zahtjeva, njegove stavke i povijest aktivnosti.

Pravila pristupa:

- administrator može dohvatiti bilo koji zahtjev,
- zaposlenik može dohvatiti samo vlastiti zahtjev.

#### Uspješan odgovor

```json
{
  "request": {
    "id_purchase_request": 1,
    "request_number": "PR-2026-0001",
    "fiscal_year": 2026,
    "department_name": "IT",
    "fk_request_status": 1,
    "created_by": "Ivan Horvat",
    "total_amount": "250.00",
    "justification": "Nabava opreme za rad.",
    "created_at": "2026-04-23T21:21:14.000Z",
    "updated_at": "2026-04-23T21:33:14.000Z",
    "status_name": "Poslano"
  },
  "items": [
    {
      "id_purchase_request_item": 1,
      "item_name": "Monitor",
      "quantity": 2,
      "category_name": "Računalna oprema"
    }
  ],
  "history": [
    {
      "id_request_status_history": 1,
      "fk_request_status": 1,
      "changed_by": "Ivan Horvat",
      "changed_at": "2026-04-23T21:21:14.000Z",
      "comment": "Zahtjev kreiran i poslan.",
      "status_name": "Poslano"
    }
  ]
}
```

#### Moguće greške

| Status | Razlog |
|---:|---|
| 404 | Zahtjev nije pronađen ili korisnik nema pristup. |
| 500 | Greška pri dohvaćanju detalja zahtjeva. |

### POST `/api/requests`

Kreira novi zahtjev za nabavu.

Novi zahtjev odmah dobiva status `Poslano`.
Backend automatski generira broj zahtjeva u formatu:

```text
PR-GGGG-XXXX
```

Primjer:

```text
PR-2026-0001
```

#### Request body

```json
{
  "fk_fiscal_year": 2,
  "fk_department": 1,
  "justification": "Nabava računalne opreme za ured.",
  "estimated_amount": 500.0,
  "items": [
    {
      "fk_item_category": 1,
      "item_name": "Monitor",
      "quantity": 2
    }
  ]
}
```

#### Obavezna polja

| Polje | Pravilo |
|---|---|
| `fk_fiscal_year` | Obavezno. |
| `fk_department` | Obavezno. |
| `justification` | Obavezno, najviše 1000 znakova. |
| `items` | Obavezno, mora sadržavati barem jednu stavku. |
| `items[].fk_item_category` | Obavezno. |
| `items[].item_name` | Obavezno. |
| `items[].quantity` | Cijeli broj veći od 0. |
| `estimated_amount` | Opcionalno, ako je uneseno mora biti pozitivan broj. |

#### Uspješan odgovor

```json
{
  "message": "Zahtjev je uspješno kreiran.",
  "id_purchase_request": 52,
  "request_number": "PR-2026-0052",
  "fk_request_status": 1
}
```

#### Moguće greške

| Status | Razlog |
|---:|---|
| 400 | Nedostaju obavezni podaci ili su neispravni. |
| 409 | Konflikt pri generiranju broja zahtjeva. |
| 500 | Greška pri kreiranju zahtjeva. |

### PUT `/api/requests/:id`

Ažurira postojeći zahtjev.

Pravila:

- administrator može uređivati zahtjev dok nije zaključan,
- zaposlenik može uređivati samo vlastiti zahtjev i samo kada je vraćen na izmjenu,
- zahtjevi u statusima `Odbijeno` i `Zatvoreno` su zaključani.

#### Request body

```json
{
  "fk_department": 1,
  "justification": "Ažurirano obrazloženje zahtjeva.",
  "estimated_amount": 450.0,
  "items": [
    {
      "fk_item_category": 1,
      "item_name": "Tipkovnica",
      "quantity": 3
    }
  ]
}
```

#### Uspješan odgovor

```json
{
  "message": "Zahtjev uspješno ažuriran."
}
```

#### Moguće greške

| Status | Razlog |
|---:|---|
| 400 | Neispravni podaci ili zaključan zahtjev. |
| 403 | Korisnik nema pravo uređivanja. |
| 404 | Zahtjev nije pronađen. |
| 500 | Greška pri ažuriranju zahtjeva. |

### PATCH `/api/requests/:id/status`

Mijenja status zahtjeva prema definiranim workflow akcijama.

#### Request body

```json
{
  "action": "preuzmi",
  "comment": "Zahtjev preuzet na obradu."
}
```

Polje `comment` je obavezno samo za određene akcije.

#### Podržane akcije

| Akcija | Iz statusa | U status | Tko može izvršiti | Uvjeti |
|---|---|---|---|---|
| `preuzmi` | Poslano | Na odobrenju | Administrator | Nema posebnih uvjeta. |
| `odbij` | Poslano | Odbijeno | Administrator | Komentar je obavezan. |
| `odobri` | Na odobrenju | Naručeno | Administrator | Zahtjev mora imati ponudu. |
| `vrati-na-izmjenu` | Na odobrenju | Vraćeno na dopunu/izmjenu | Administrator | Komentar je obavezan. |
| `resubmit` | Vraćeno na dopunu/izmjenu | Poslano | Vlasnik zahtjeva ili administrator | Zahtjev ne smije biti zaključan. |
| `zavrsi` | Naručeno | Zatvoreno | Administrator | Zahtjev mora imati ponudu, otpremnicu i iznos. |

#### Uspješan odgovor

```json
{
  "message": "Akcija \"preuzmi\" je uspješno izvršena.",
  "fk_request_status": 2
}
```

#### Moguće greške

| Status | Razlog |
|---:|---|
| 400 | Nepoznata akcija, nedozvoljena tranzicija ili nedostaje obavezni dokument/komentar. |
| 403 | Korisnik nema ovlasti za akciju. |
| 404 | Zahtjev nije pronađen. |
| 500 | Greška pri izvršavanju akcije. |

## Request Attachments API

Rute za dokumente vezane uz zahtjev koriste kombinaciju prefiksa:

```text
/api/requests/:id/attachments
/api/attachments
```

Sve rute zahtijevaju JWT token.

### GET `/api/requests/:id/attachments`

Dohvaća dokumente vezane uz određeni zahtjev.

Pravila pristupa:

- administrator vidi dokumente svih zahtjeva,
- zaposlenik vidi dokumente samo za vlastite zahtjeve.

#### Uspješan odgovor

```json
[
  {
    "id_attachment": 1,
    "file_name": "ponuda.pdf",
    "file_type": "application/pdf",
    "document_type": "Ponuda",
    "uploaded_at": "2026-04-23T21:25:11.000Z",
    "fk_uploaded_by_user": 2,
    "uploaded_by": "Ivan Horvat"
  }
]
```

### POST `/api/requests/:id/attachments`

Dodaje dokument na zahtjev.

Content-Type:

```http
multipart/form-data
```

#### Form data

| Polje | Opis |
|---|---|
| `file` | Datoteka koja se uploada. |
| `document_type` | `Ponuda` ili `Otpremnica`. |

#### Pravila po tipu dokumenta

| Tip dokumenta | Dozvoljeni statusi |
|---|---|
| `Ponuda` | Poslano, Na odobrenju, Vraćeno na dopunu/izmjenu |
| `Otpremnica` | Naručeno |

#### Podržani MIME tipovi

```text
application/pdf
application/msword
application/vnd.openxmlformats-officedocument.wordprocessingml.document
application/vnd.ms-excel
application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
image/jpeg
image/png
text/plain
application/zip
```

Maksimalna veličina datoteke:

```text
10 MB
```

#### Uspješan odgovor

```json
{
  "message": "Fajl uspješno uploadan.",
  "id_attachment": 10,
  "file_name": "ponuda.pdf",
  "document_type": "Ponuda",
  "fk_request_status": 1
}
```

#### Moguće greške

| Status | Razlog |
|---:|---|
| 400 | Datoteka nije poslana, tip dokumenta nije dozvoljen, status ne dopušta upload ili je zahtjev zaključan. |
| 404 | Zahtjev nije pronađen. |
| 500 | Greška pri spremanju datoteke. |

### GET `/api/attachments/download/:id`

Preuzima dokument.

Pravila pristupa:

- administrator može preuzeti svaki dokument,
- zaposlenik može preuzeti samo dokumente vezane uz vlastite zahtjeve.

#### Uspješan odgovor

Server vraća binarni sadržaj datoteke uz odgovarajuće HTTP headere:

```http
Content-Disposition: attachment; filename="naziv-datoteke.pdf"
Content-Type: application/pdf
```

#### Moguće greške

| Status | Razlog |
|---:|---|
| 404 | Dokument nije pronađen ili datoteka ne postoji na disku. |
| 500 | Greška pri preuzimanju datoteke. |

### DELETE `/api/attachments/delete/:id`

Briše dokument.

Pravila:

- administrator može brisati dokumente dok zahtjev nije zaključan,
- zaposlenik može brisati samo vlastite uploadane dokumente na vlastitim zahtjevima,
- dokumenti se ne mogu brisati ako je zahtjev u statusu `Odbijeno` ili `Zatvoreno`.

#### Uspješan odgovor

```json
{
  "message": "Fajl uspješno obrisan."
}
```

#### Moguće greške

| Status | Razlog |
|---:|---|
| 400 | Zahtjev je zaključan. |
| 403 | Korisnik nema dozvolu za brisanje dokumenta. |
| 404 | Dokument nije pronađen. |
| 500 | Greška pri brisanju dokumenta. |

## Reference API

Rute za referentne podatke koriste prefiks:

```text
/api/reference
```

Sve rute zahtijevaju JWT token.

### GET `/api/reference/active-fiscal-year`

Dohvaća aktivnu poslovnu godinu.

Aktivnom se smatra godina kod koje je:

```text
is_closed = 0
```

Ako postoji više otvorenih godina, vraća se godina s najvećom vrijednosti `year`.

#### Uspješan odgovor

```json
{
  "id_fiscal_year": 2,
  "year": 2026
}
```

#### Moguće greške

| Status | Razlog |
|---:|---|
| 404 | Nema aktivne fiskalne godine. |
| 500 | Greška pri dohvaćanju aktivne fiskalne godine. |

### GET `/api/reference/departments`

Dohvaća aktivna mjesta troška / odjele.

#### Uspješan odgovor

```json
[
  {
    "id_department": 1,
    "name": "IT"
  }
]
```

#### Napomena

Trenutno se vraćaju svi aktivni odjeli bez eksplicitnog filtriranja po poslovnoj godini u API ruti.

### GET `/api/reference/item-categories`

Dohvaća aktivne predmete nabave / kategorije.

#### Uspješan odgovor

```json
[
  {
    "id_item_category": 1,
    "name": "Računalna oprema"
  }
]
```

#### Napomena

Trenutno se vraćaju sve aktivne kategorije bez eksplicitnog filtriranja po poslovnoj godini u API ruti.

## Test API

### GET `/api/test`

Testna ruta za provjeru rada servera i baze.

Ova ruta nije dio poslovnog API-ja i koristi se samo za razvojnu provjeru.

## Statusi zahtjeva

Trenutno korišteni statusi:

| ID | Naziv |
|---:|---|
| 1 | Poslano |
| 2 | Na odobrenju |
| 3 | Vraćeno na dopunu/izmjenu |
| 5 | Odbijeno |
| 6 | Naručeno |
| 7 | Zatvoreno |

Status `Odobreno` postoji u bazi kao stariji status, ali ga trenutni workflow ne koristi kao zasebnu fazu.

## Poznata ograničenja API-ja

| Ograničenje | Opis |
|---|---|
| Nema registracije korisnika | API nema rute za admin kreiranje korisnika. |
| Nema admin API-ja za poslovne godine | Aktivna godina se samo dohvaća. |
| Nema CRUD API-ja za šifrarnike | Odjeli i kategorije se samo dohvaćaju. |
| Nema serverske paginacije | `GET /api/requests` vraća sve dostupne zahtjeve. |
| Nema query filtera | Filtriranje zahtjeva radi frontend. |
| Nema narudžbenice i ostalih dokumenata | Podržani su samo `Ponuda` i `Otpremnica`; ostali tipovi izvan su opsega projekta. |
| Limiti se ne koriste u API-ju | Polja limita postoje u bazi, ali API ne računa potrošnju. |
| Upload putanje su lokalne | U bazi se sprema filesystem putanja dokumenta. |

## Primjer korištenja API-ja

Tipičan redoslijed korištenja:

1. Korisnik se prijavi preko `POST /api/auth/login`.
2. Frontend sprema JWT token.
3. Frontend dohvaća aktivnu godinu preko `GET /api/reference/active-fiscal-year`.
4. Frontend dohvaća odjele i kategorije preko reference API-ja.
5. Korisnik kreira zahtjev preko `POST /api/requests`.
6. Ako ima ponudu, frontend šalje upload preko `POST /api/requests/:id/attachments`.
7. Administrator dohvaća zahtjev preko `GET /api/requests/:id`.
8. Administrator mijenja status preko `PATCH /api/requests/:id/status`.
9. Korisnik ili administrator dodaje otpremnicu.
10. Administrator zatvara zahtjev akcijom `zavrsi`.
