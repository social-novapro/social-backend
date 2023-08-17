const router = require('express').Router();
const lookup = require('./lookup');
const get = require('./get');
const list = require('./list');
const resolve = require('./resolve');
const review = require('./review');
const overrideReview = require('./overrideReview');

router.use('/lookup', lookup);
router.use('/get', get);
router.use('/list', list);
router.use('/resolve', resolve);
router.use('/review', review);
router.use('/overrideReview', overrideReview);

module.exports = router;
