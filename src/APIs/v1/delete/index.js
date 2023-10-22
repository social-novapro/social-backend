const router = require('express').Router();
const unfollowUser = require('./unfollowUser');

router.use('/unfollowUser', unfollowUser);

module.exports = router;
