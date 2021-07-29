const router = require('express').Router()
const newUser = require('./post/newUser')
const userLogin = require('./get/login')
const newDev = require('./post/newDev')

router.use('/post/newUser', newUser)
router.use('/post/newDev', newDev)
// router.use('/get/login', userLogin)

module.exports = router;
