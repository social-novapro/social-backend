const router = require('express').Router();
const requests = require('./requests');
const set = require('./set');

router.use('/requests', requests);
router.use('/set', set);

module.exports = router;
