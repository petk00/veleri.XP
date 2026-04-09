# veleri.XP

web aplikacije za upravljanje procesom nabave.  

## 🎯 Cilj aplikacije

Glavni cilj sustava je omogućiti jednostavniji, brži i transparentniji proces interne nabave.

- ✅ digitalno podnošenje zahtjeva za nabavu
- ✅ pregled svih aktivnih i završenih zahtjeva
- ✅ upravljanje statusima zahtjeva
- ✅ jasnu podjelu korisničkih ovlasti
- ✅ jednostavnije praćenje tijeka procesa
- ✅ bolju organizaciju dokumentacije

## 👥 Korisničke uloge

- 🧑‍💼 **User**  
  Kreira zahtjev za nabavu, učitava potrebne podatke i prati status vlastitih zahtjeva.

- 🛡 **Administrator**  
  Upravlja korisnicima, ulogama, osnovnim postavkama sustava i pristupnim pravima.
  Pregledava pristigle zahtjeve, obrađuje ih, upravlja statusima i vodi daljnji tijek postupka.

## 🛠️ Tehnologije

Planirani tehnološki stack:

- **Frontend:** Vue.js + Quasar Framework  
- **Backend:** Node.js + Express  
- **Baza podataka:** MySQL  
- **API komunikacija:** REST  
- **Autentifikacija:** 


## 🧱 Arhitektura projekta

```bash
project-root/
│
├── ckient/          # Vue + Quasar aplikacija
├── server/          # API, poslovna logika i autentifikacija
├── database/        # modeli baze, skripte i inicijalni podaci
├── docs/            # dokumentacija, ER
└── README.md


                                          
                                          
