const router = require('express').Router();
const requests = require('./requests');

router.use('/requests', requests);


module.exports = router;
