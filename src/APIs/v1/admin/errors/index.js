const router = require('express').Router();
const lookup = require('./lookup');
const get = require('./get');
const list = require('./list');
const resolved = require('./resolved');
const reviewed = require('./reviewed');

router.use('/lookup', lookup);
router.use('/get', get);
router.use('/list', list);
router.use('/resolved', resolved);
router.use('/reviewed', reviewed);

module.exports = router;
