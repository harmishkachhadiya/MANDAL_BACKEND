const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backup.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/permission.middleware');

// Apply authentication to all backup endpoints
router.use(authenticateToken);

const FORM_NAME = 'USER_UTILITY';

// View list and download backups requires VIW permission on USER_UTILITY
router.get('/list', checkPermission(FORM_NAME, 'VIW'), backupController.listBackups);
router.get('/download/:filename', checkPermission(FORM_NAME, 'VIW'), backupController.downloadBackup);

// Create backup requires VIW permission on USER_UTILITY
router.post('/create', checkPermission(FORM_NAME, 'VIW'), backupController.createBackup);

// Email backup requires VIW permission on USER_UTILITY
router.post('/email', checkPermission(FORM_NAME, 'VIW'), backupController.emailBackup);

// Delete backup requires DEL permission on USER_UTILITY
router.delete('/:filename', checkPermission(FORM_NAME, 'DEL'), backupController.deleteBackup);

module.exports = router;
