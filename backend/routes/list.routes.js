const router = require('express').Router();
const listController = require('../controllers/list.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', listController.createList);
router.get('/:boardId', listController.getListsByBoard);

module.exports = router;
