require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth.routes');
const permissionRoutes = require('./src/routes/permission.routes');
const transactionRoutes = require('./src/routes/transaction.routes');
const partyRoutes = require('./src/routes/party.routes');
const ledgerRoutes = require('./src/routes/ledger.routes');
const backupRoutes = require('./src/routes/backup.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/parties', partyRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/backup', backupRoutes);

app.get(['/', '/api', '/api/health'], (req, res) => {
    res.json({ status: 'ok', message: 'Financial Ledger API is running' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
