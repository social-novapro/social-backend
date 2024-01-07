const router = require('express').Router();
const get = require('./get');
const set = require('./set');
const setOne = require('./setOne');

router.use('/get', get);
router.use('/set', set);
router.use('/setOne', setOne);

module.exports = router;
