const router = require('express').Router();
const profile = require('./profile');
const public = require('./public');

router.use('/profile', profile);
router.use('/public', public);

module.exports = router;
