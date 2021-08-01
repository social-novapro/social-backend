const router = require('express').Router()
const removePost = require('./removePost')

router.use('/removePost', removePost)

module.exports = router;
