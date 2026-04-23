const router = require('express').Router();
const profileController = require('../controllers/profile.controller');
const { authenticate } = require('../middleware/auth');

// All profile routes require authentication
router.use(authenticate);

// Profile logic is scoped by :userId
router.get('/:userId/activity', profileController.getUserProfile);

module.exports = router;
