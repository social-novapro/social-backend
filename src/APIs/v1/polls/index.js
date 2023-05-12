const router = require('express').Router();
const create = require('./create');
const data = require('./data');
const vote = require('./vote');

router.use('/create', create);
router.use('/data', data);
router.use('/vote', vote);

module.exports = router;
