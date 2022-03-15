const router = require('express').Router();
const createPost = require('./createPost');

router.use('/createPost', createPost);

module.exports = router;
