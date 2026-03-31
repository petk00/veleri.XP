const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors()); // Dozvoljava Quasaru da pristupi
app.use(express.json()); // Omogućava čitanje JSON podataka iz requesta

// Primjer rute za login (samo za test)
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  console.log("Stigao pokušaj logina:", email);
  
  // Ovde će kasnije ići provera u bazi
  res.json({ success: true, message: "Server je primio podatke!" });
});

app.listen(3000, () => console.log("Server na portu 3000"));