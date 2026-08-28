const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/permission.middleware');

const FORM_NAME = 'USER_UTILITY';

// Public login route
router.post('/login', authController.login);

// Protected routes
router.get('/users', authenticateToken, authController.getUsers);
router.post('/register', authenticateToken, checkPermission(FORM_NAME, 'UPD'), authController.register);
router.delete('/users/:userid', authenticateToken, checkPermission(FORM_NAME, 'DEL'), authController.deleteUser);
router.put('/change-password', authenticateToken, authController.changePassword);

module.exports = router;
