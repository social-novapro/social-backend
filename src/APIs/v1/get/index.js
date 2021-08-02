const router = require('express').Router()
const user = require('./user')
const allPosts = require('./allPosts')
const allUsers = require('./allUsers')
const allPublicData = require('./allPublicData')
const post = require('./post')
const search = require('./search')

router.use('/user', user);
router.use('/allPosts', allPosts);
router.use('/allUsers', allUsers)
router.use('/allPublicData', allPublicData)
router.use('/post', post)
router.use('/search', search)

module.exports = router;
