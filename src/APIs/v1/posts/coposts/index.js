const router = require('express').Router();

const approve = require('./approve');
const decline = require('./decline');
const requests = require('./requests');

router.use('/approve', approve);
router.use('/decline', decline);
router.use('/requests', requests);

module.exports = router;
