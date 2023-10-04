const router = require('express').Router();
const get = require('./get');
const create = require('./create');

router.use('/get', get);
router.use('/create', create);

module.exports = router;
