const router = require('express').Router();
const create = require('./create');
const get = require('./get');
const vote = require('./voteOption');
const edit = require('./edit');

router.use('/create', create);
router.use('/get', get);
router.use('/vote', vote);
router.use('/edit', edit);

module.exports = router;
