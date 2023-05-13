const router = require('express').Router();
const create = require('./create');
const data = require('./data');
const vote = require('./voteOption');

router.use('/create', create);
router.use('/data', data);
router.use('/vote', vote);

module.exports = router;
