const router = require('express').Router();
const user = require('./user');
const username = require('./username');
const allPosts = require('./allPosts');
const allUsers = require('./allUsers');
const allPublicData = require('./allPublicData');
const post = require('./post');
const search = require('./search');
const analyticTrend = require('./analyticTrend');

router.use('/user', user);
router.use('/username', username);
router.use('/allPosts', allPosts);
router.use('/allUsers', allUsers)
router.use('/allPublicData', allPublicData);
router.use('/post', post);
router.use('/search', search);
router.use('/analyticTrend', analyticTrend);

module.exports = router;
