const router = require('express').Router();
const acceptVerification = require('./acceptVerification');
const denyVerification = require('./denyVerification');

router.use('/acceptVerification', acceptVerification);
router.use('/denyVerification', denyVerification);

module.exports = router;
