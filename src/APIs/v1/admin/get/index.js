const router = require('express').Router();
const verificationRequests = require('./verificationRequests');
const verificationList = require('./verificationList');
const adminRequests = require('./adminRequests');
const adminList = require('./adminList');

router.use('/verificationRequests', verificationRequests);
router.use('/verificationList', verificationList);
router.use('/adminRequests', adminRequests);
router.use('/adminList', adminList);

module.exports = router;
