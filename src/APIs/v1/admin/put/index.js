const router = require('express').Router();
const acceptVerification = require('./acceptVerification');
const denyVerification = require('./denyVerification');
const acceptAdmin = require('./acceptAdmin');
const denyAdmin = require('./denyAdmin');

router.use('/acceptVerification', acceptVerification);
router.use('/denyVerification', denyVerification);
router.use('/acceptAdmin', acceptAdmin);
router.use('/denyAdminVerification', denyAdmin);

module.exports = router;
