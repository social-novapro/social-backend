const router = require('express').Router();
const verificationRequests = require('./verificationRequests');

router.use('/verificationRequests', verificationRequests);

module.exports = router;
