const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permission.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/permission.middleware');

const FORM_NAME = 'PERMAST_ENTRY';

router.get('/:userid', authenticateToken, permissionController.getUserPermissions);
router.post('/', authenticateToken, checkPermission(FORM_NAME, 'UPD'), permissionController.setPermission);
router.delete('/:userid/:formName', authenticateToken, checkPermission(FORM_NAME, 'DEL'), permissionController.deletePermission);

module.exports = router;
