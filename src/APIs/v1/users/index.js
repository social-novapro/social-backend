const router = require('express').Router();
const profile = require('./profile');
const public = require('./public');
const reqDelete = require('./reqDelete');
const edit = require('./edit');
const privacy = require('./privacy');
const badges = require('./badges');
const getApi = require('./get');
const follow = require('./follow');
const unfollow = require('./unfollow');
const following = require('./following');
const followers = require('./followers');
const update = require('./update');

router.use('/profile', profile);
router.use('/public', public);
router.use('/reqDelete', reqDelete);
router.use('/edit', edit);
router.use('/privacy', privacy);
router.use('/badges', badges);
router.use('/get', getApi);
router.use('/follow', follow);
router.use('/unfollow', unfollow);
router.use('/following', following);
router.use('/followers', followers);
router.use('/update', update);

module.exports = router;
