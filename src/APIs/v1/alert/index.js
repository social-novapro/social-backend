const router = require('express').Router();
const get = require('./get');
const create = require('./create');
const edit = require('./edit');

router.use('/get', get);
router.use('/create', create);
router.use('/edit', edit);

module.exports = router;
