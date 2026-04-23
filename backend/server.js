const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { startReplyPoller } = require('./services/replyService');

dotenv.config();
connectDB().then(() => startReplyPoller());

const app = express();

app.use(cors({ origin: true, credentials: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/track', require('./routes/track'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/emails', require('./routes/emails'));
app.use('/api/logs', require('./routes/logs'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
