const router = require('express').Router();
const profile = require('./profile');
const public = require('./public');
const reqDelete = require('./reqDelete');
const edit = require('./edit');

router.use('/profile', profile);
router.use('/public', public);
router.use('/reqDelete', reqDelete);
router.use('/edit', edit);

module.exports = router;
