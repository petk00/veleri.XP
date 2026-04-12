const express = require('express');
const cors = require('cors');
require('dotenv').config();

const testRoutes = require('./routes/testRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Server radi' });
});

app.use('/api/test', testRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server radi na portu ${PORT}`);
});