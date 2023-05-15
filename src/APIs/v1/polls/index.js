const router = require('express').Router();
const create = require('./create');
const data = require('./data');
const vote = require('./voteOption');
const edit = require('./edit');

router.use('/create', create);
router.use('/data', data);
router.use('/vote', vote);
router.use('/edit', edit);

module.exports = router;
