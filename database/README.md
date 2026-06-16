# Baza podataka — veleri.XP

MySQL 8.0, InnoDB, `utf8mb4_unicode_ci`

## Datoteke

| Datoteka | Opis |
|---|---|
| `schema[veleri.XP].sql` | DDL — struktura svih tablica |
| `seed[veleri.XP].sql` | Inicijalni podaci (uloge, statusi, odjeli, kategorije, početni korisnici) |

Init skripte za Docker nalaze se u `../db/` (kopije istih fajlova, prefiksane redoslijedom izvršavanja).

## Ručni import (bez Dockera)

```bash
mysql -u root -p -e "CREATE DATABASE XP CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p XP < schema[veleri.XP].sql
mysql -u root -p XP < seed[veleri.XP].sql
```

## Tablice

| Tablica | Opis |
|---|---|
| `Role` | Uloge korisnika (Administrator, Zaposlenik) |
| `AppUser` | Korisnički računi |
| `FiscalYear` | Poslovne godine |
| `Department` | Odjeli vezani uz poslovnu godinu |
| `ItemCategory` | Kategorije nabave vezane uz poslovnu godinu |
| `RequestStatus` | Šifarnik statusa (7 statusa) |
| `PurchaseRequest` | Zahtjevi za nabavu |
| `PurchaseRequestItem` | Stavke zahtjeva |
| `Attachment` | Priloženi dokumenti (Ponuda, Otpremnica) |
| `RequestStatusHistory` | Audit trail promjena statusa |
