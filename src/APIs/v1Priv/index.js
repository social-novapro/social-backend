const router = require('express').Router()
const newUser = require('./post/newUser')
const userLogin = require('./get/login')
const newDev = require('./post/newDev')
const allUserData = require('./get/allUserData')
const newAppToken = require('./post/newAppToken')

router.use('/post/newUser', newUser)
router.use('/post/newDev', newDev)
router.use('/post/newAppToken', newAppToken)
router.use('/get/allUserData', allUserData)
// router.use('/get/login', userLogin)

module.exports = router;
