const router = require('express').Router();
const get = require('./get');
const set = require('./set');

router.use('/get', get);
router.use('/set', set);

module.exports = router;
