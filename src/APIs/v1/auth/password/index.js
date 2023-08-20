const router = require('express').Router();

const change = require('./change');
const forgot = require('./forgot');
const requests = require('./requests');

router.use('/change', change);
router.use('/forgot', forgot);

router.use('/requests', requests);

module.exports = router;
