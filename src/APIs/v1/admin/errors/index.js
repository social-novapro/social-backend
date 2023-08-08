const router = require('express').Router();
const list = require('./list');
const demo = require('./demo');
const resolved = require('./resolved');
const reviewed = require('./reviewed');

router.use('/list', list);
router.use('/demo', demo);
router.use('/resolved', resolved);
router.use('/reviewed', reviewed);

module.exports = router;
