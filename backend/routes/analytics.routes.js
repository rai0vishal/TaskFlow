const router = require('express').Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/dashboard', analyticsController.getDashboardData);
router.get('/user/:userId', analyticsController.getUserAnalytics);

module.exports = router;
