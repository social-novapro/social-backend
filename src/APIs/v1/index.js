const router = require('express').Router()
const get = require('./get')
const post = require('./post')
const auth = require('./auth')

router.use('/get', get);
router.use('/post', post)
router.use('/auth', auth)

module.exports = router;
