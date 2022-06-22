const router = require('express').Router();
const createPost = require('./createPost');
const savePost = require('./savePost');
const requestVerify = require('./requestVerify');

router.use('/createPost', createPost);
router.use('/savePost', savePost);
router.use('/requestVerify', requestVerify);

module.exports = router;
