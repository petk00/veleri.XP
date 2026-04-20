# 📦 veleri.XP

This project appears to be a well-organized full-stack application for managing requests, with a Quasar-based Vue.js frontend and a Node.js backend. The structure separates concerns effectively (client, server, database, docs), includes authentication, routing, and file handling, and uses modern tools like Axios and stores.

## 🐇 DO SADA NAPRAVLJENO:

✅ Login / logout
✅ Wizard za kreiranje zahtjeva (skica / pošalji)
✅ Lista zahtjeva s chipovima u boji
✅ Detalji zahtjeva s timeline-om
✅ Approval flow (Odobri/Odbij) s komentarom
✅ Audit trail kroz status history

## ✨ Overview

veleri.XP je osmišljena kao jednostavna i pregledna aplikacija za internu nabavu.

Fokus prve verzije:
- evidencija zahtjeva za nabavu
- obrada i pregled zahtjeva
- praćenje statusa
- upravljanje korisničkim ulogama
- pohrana osnovne dokumentacije

---

## 🎯 Goals

- digitalizirati proces nabave
- smanjiti ručni rad i nepreglednost
- omogućiti jasniji tijek obrade zahtjeva
- osigurati bolju evidenciju i pregled podataka

---

## 👥 Roles

- **User** — kreira i prati vlastite zahtjeve 
- **Administrator** — obrađuje zahtjeve i upravlja statusima, upravlja korisnicima, rolama i postavkama sustava

---

## ⚙️ Core Features

- kreiranje zahtjeva za nabavu
- pregled i filtriranje zahtjeva
- promjena statusa zahtjeva
- upravljanje dokumentacijom
- autentifikacija i autorizacija korisnika
- financijska evidencija i financijski pregled procesa

---

## 🛠 Tech Stack

- **Frontend:** Vue.js + Quasar
- **Backend:** Node.js + Express
- **Database:** MariaDB / MySQL
- **API:** REST

---

## 🔐 Access Model

- novi korisnik dobiva osnovnu korisničku ulogu
- naprednije ovlasti dodjeljuje super administrator

---

## 📌 Project Status

**Version:** 0.1  
**Stage:** early development / MVP

Projekt je trenutno u fazi definiranja modela sustava, poslovne logike i osnovnih funkcionalnosti.

---

## 🧠 Development Approach

Projekt se razvija prema principu:

**KISS — Keep It Simple, Stupid**

Cilj je izgraditi sustav koji je:
- jednostavan za korištenje
- logičan za održavanje
- dovoljno fleksibilan za buduće proširenje

---

## 🎓 Academic Context

Projekt se razvija u sklopu studija na:

**Veleučilište u Rijeci**  
**Stručni diplomski studij Informacijske tehnologije u poslovnim sustavima**  
**Smjer: Programsko inženjerstvo**

---

## ✍️ Author

**Igor Petković**

---

## 🧱 Project Structure

```text
project-root/
├── frontend/     # Vue + Quasar aplikacija
├── backend/      # API i poslovna logika
├── database/     # modeli baze i SQL skripte
├── docs/ 
└── README.md


## 🐇 Specifikacija zahtjeva

