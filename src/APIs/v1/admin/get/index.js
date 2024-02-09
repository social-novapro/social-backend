const router = require('express').Router();
const verificationRequests = require('./verificationRequests');
const verificationList = require('./verificationList');

router.use('/verificationRequests', verificationRequests);
router.use('/verificationList', verificationList);

module.exports = router;
