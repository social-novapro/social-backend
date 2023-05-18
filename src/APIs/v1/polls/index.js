const router = require('express').Router();
const create = require('./create');
const get = require('./get');
const vote = require('./voteOption');
const edit = require('./edit');
const deleteRoute = require('./delete');
const appOptions = require('./addOptions');

router.use('/create', create);
router.use('/get', get);
router.use('/vote', vote);
router.use('/edit', edit);
router.use('/delete', deleteRoute);
router.use('/addOptions', appOptions);

module.exports = router;
