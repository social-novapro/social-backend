const router = require('express').Router();
const requestVerify = require('./requestVerify');
const followUser = require('./followUser');

router.use('/requestVerify', requestVerify);
router.use('/followUser', followUser);

module.exports = router;
