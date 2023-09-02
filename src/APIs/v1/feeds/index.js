const router = require('express').Router();
const possibleFeeds = require('./possibleFeeds');
const allPosts = require('./allPosts');
const subscriptionFeed = require('./subscriptionFeed');
const userFeed = require("./userFeed");
const preference = require('./preference');

router.use('/possibleFeeds', possibleFeeds)
router.use('/userFeed', userFeed)
router.use('/allPosts', allPosts);
router.use('/subscriptionFeed', subscriptionFeed);
router.use('/preference', preference);

module.exports = router;
