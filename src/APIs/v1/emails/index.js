const router = require('express').Router();
const requests = require('./requests');
const set = require('./set');
const userData = require('./userData');

router.use('/requests', requests);
router.use('/set', set);
router.use('/userData', userData);

module.exports = router;
