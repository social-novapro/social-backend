const router = require('express').Router();
const editPost = require('./editPost');
const editUsername = require('./editUsername');
const editDisplayname  = require('./editDisplayname');
const likePost = require('./likePost');

router.use('/editPost', editPost);
router.use('/editUsername', editUsername);
router.use('/editDisplayname', editDisplayname);
router.use('/likePost', likePost);

module.exports = router;
