const router = require('express').Router()
const user = require('./user')
const allPosts = require('./allPosts')
const post = require('./post')


router.use('/user', user);
router.use('/allPosts', allPosts);
router.use('/post', post)

module.exports = router;
