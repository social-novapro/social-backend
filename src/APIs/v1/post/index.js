const router = require('express').Router();
const requestVerify = require('./requestVerify');

router.use('/requestVerify', requestVerify);

module.exports = router;
