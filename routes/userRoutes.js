const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

router.use(authenticate);

router.put('/profile', userController.updateUser);
router.delete('/profile', userController.deleteUser);
router.post('/disable', userController.disableUser);

module.exports = router;