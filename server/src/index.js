const express = require('express');
const cors = require('cors');
require('dotenv').config();

const testRoutes = require('./routes/testRoutes');
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const requestAttachmentRoutes = require('./routes/requestAttachmentRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes');
const referenceRoutes = require('./routes/referenceRoutes');
const userRoutes = require('./routes/userRoutes');
const fiscalYearRoutes = require('./routes/fiscalYearRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/test', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/requests', requestAttachmentRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/reference', referenceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fiscal-years', fiscalYearRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});