const router = require('express').Router()
const editPost = require('./editPost')
const editUsername = require('./editUsername')

router.use('/editPost', editPost);
router.use('/editUsername', editUsername);

module.exports = router;
