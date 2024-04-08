const router = require('express').Router();
const profile = require('./profile');
const public = require('./public');
const reqDelete = require('./reqDelete');
const edit = require('./edit');
const privacy = require('./privacy');
const badges = require('./badges');

router.use('/profile', profile);
router.use('/public', public);
router.use('/reqDelete', reqDelete);
router.use('/edit', edit);
router.use('/privacy', privacy);
router.use('/badges', badges);

module.exports = router;
