const router = require('express').Router();
const approve = require('./approve');
const deny = require('./deny');
const list = require('./list');

router.use('/approve', approve);
router.use('/deny', deny);
router.use('/list', list);

module.exports = router;
