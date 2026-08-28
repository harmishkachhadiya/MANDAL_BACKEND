const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledger.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/permission.middleware');

// Apply authentication
router.use(authenticateToken);

const FORM_NAME = 'LEDGER_VIEW';

// Get Ledger Statement (Accessible to authenticated users for dashboard aggregations; page view protected in UI at /ledger-statement)
// Example: GET /api/ledger?pcode=P001&from=2026-08-01&to=2026-08-31
router.get('/', ledgerController.getLedgerStatement);

module.exports = router;
