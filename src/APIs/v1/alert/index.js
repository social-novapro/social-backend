const router = require('express').Router();
const get = require('./get');
const create = require('./create');
const edit = require('./edit');
const dismiss = require('./dismiss')
const archive = require('./archive')

router.use('/get', get);
router.use('/create', create);
router.use('/edit', edit);
router.use('/dimiss', dismiss);
router.use('/archive', archive);

module.exports = router;
