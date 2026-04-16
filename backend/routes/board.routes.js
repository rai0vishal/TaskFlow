const router = require('express').Router();
const boardController = require('../controllers/board.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', boardController.createBoard);
router.get('/:workspaceId', boardController.getBoardsByWorkspace);

module.exports = router;
