const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend radi' });
});

// Primjer rute za login (samo za test)
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  console.log('Stigao pokušaj logina:', email);

  res.json({ success: true, message: 'Server je primio podatke!' });
});

app.listen(3000, () => console.log('Server na portu 3000'));