const router = require('express').Router()
const newUser = require('./newUser')
const newDev = require('./newDev')
const newAppToken = require('./newAppToken')

router.use('/post/newUser', newUser)
router.use('/post/newDev', newDev)
router.use('/post/newAppToken', newAppToken)

module.exports = router;