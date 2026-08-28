const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/permission.middleware');

// Apply authentication to all transaction routes
router.use(authenticateToken);

// Define form name for permission checking
const FORM_NAME = 'TRNMAST_ENTRY';

// Get transactions by date
router.get('/', transactionController.getTransactionsByDate);

// Create a transaction (Requires UPD permission)
router.post('/', checkPermission(FORM_NAME, 'UPD'), transactionController.createTransaction);

// Update an existing transaction (Requires UPD permission)
router.put('/:id', checkPermission(FORM_NAME, 'UPD'), transactionController.updateTransaction);

// Delete a transaction (Requires DEL permission)
router.delete('/:id', checkPermission(FORM_NAME, 'DEL'), transactionController.deleteTransaction);

module.exports = router;
