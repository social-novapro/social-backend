const router = require('express').Router()
const newUser = require('./post/newUser')
const userLogin = require('./get/login')

router.use('/post/newUser', newUser)
// router.use('/get/login', userLogin)

module.exports = router;
