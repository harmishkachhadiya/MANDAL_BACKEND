const express = require('express');
const router = express.Router();
const partyController = require('../controllers/party.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/permission.middleware');

// Apply authentication
router.use(authenticateToken);

const FORM_NAME = 'PARMAST_ENTRY';

// Get all parties (Accessible to authenticated users for dropdowns & dashboard; page view protected in UI at /party-master)
router.get('/', partyController.getParties);

// Create or update a party (Requires UPD permission)
router.post('/', checkPermission(FORM_NAME, 'UPD'), partyController.saveParty);

// Delete a party (Requires DEL permission)
router.delete('/:id', checkPermission(FORM_NAME, 'DEL'), partyController.deleteParty);

module.exports = router;
