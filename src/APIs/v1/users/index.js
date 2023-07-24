const router = require('express').Router();
const profile = require('./profile');
const public = require('./public');
const reqDelete = require('./reqDelete');

router.use('/profile', profile);
router.use('/public', public);
router.use('/reqDelete', reqDelete);

module.exports = router;
