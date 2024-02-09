const router = require('express').Router();
const accept = require('./accept');
const deny = require('./accept');
const list = require('./list');

router.use('/accept', accept);
router.use('/deny', deny);
router.use('/list', list);

module.exports = router;
