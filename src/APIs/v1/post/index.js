const router = require('express').Router();
const createPost = require('./createPost');
const savePost = require('./savePost');
const requestVerify = require('./requestVerify');
const subUser = require('./subUser');

router.use('/createPost', createPost);
router.use('/savePost', savePost);
router.use('/requestVerify', requestVerify);
router.use('/subUser', subUser);

module.exports = router;
