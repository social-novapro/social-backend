const router = require('express').Router();
const removePost = require('./removePost');
const unfollowUser = require('./unfollowUser');
const unsubUser = require('./unsubUser');
const unlikePost = require('./unlikePost');
const dismissNotification = require('./dismissNotification');

router.use('/removePost', removePost);
router.use('/unfollowUser', unfollowUser);
router.use('/unsubUser', unsubUser);
router.use('/unlikePost', unlikePost);
router.use('/dismissNotification', dismissNotification);

module.exports = router;
