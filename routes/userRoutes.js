const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

// Authentication guard for all user routes
router.use(authenticate);

// Additional role-based guard for specific routes (optional)
router.put('/profile', userController.updateUser);
router.delete('/profile', userController.deleteUser);
router.post('/disable', userController.disableUser);

module.exports = router;