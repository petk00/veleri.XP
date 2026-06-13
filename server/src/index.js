const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const testRoutes = require('./routes/testRoutes');
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const requestAttachmentRoutes = require('./routes/requestAttachmentRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes');
const referenceRoutes = require('./routes/referenceRoutes');
const userRoutes = require('./routes/userRoutes');
const fiscalYearRoutes = require('./routes/fiscalYearRoutes');

const REQUIRED_ENV = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_NAME'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[startup] Nedostaje env varijabla: ${key}`);
    process.exit(1);
  }
}

const app = express();

app.use(helmet());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Previše pokušaja prijave. Pokušajte ponovo za 15 minuta.' },
});

const setPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Previše pokušaja. Pokušajte ponovo za sat vremena.' },
});

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
  : ['http://localhost:9000', 'http://localhost:8080'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin nije dozvoljen — ${origin}`));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use('/api/test', testRoutes);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/set-password', setPasswordLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/requests', requestAttachmentRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/reference', referenceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fiscal-years', fiscalYearRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Ruta nije pronađena.' });
});

app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).json({ message: 'Interna greška servera.' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
  process.exit(1);
});