const router = require('express').Router()
const editPost = require('./editPost')
const editUsername = require('./editUsername')
const editDisplayname  = require('./editDisplayname')

router.use('/editPost', editPost);
router.use('/editUsername', editUsername);
router.use('/editDisplayname', editDisplayname);

module.exports = router;
