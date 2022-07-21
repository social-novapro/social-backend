const router = require('express').Router();
const removePost = require('./removePost');
const unfollowUser = require('./unfollowUser');
const unsubUser = require('./unsubUser');

router.use('/removePost', removePost);
router.use('/unfollowUser', unfollowUser);
router.use('/unsubUser', unsubUser);

module.exports = router;
