const router = require('express').Router()
const newUser = require('./newUser')
const newDev = require('./newDev')
const newAppToken = require('./newAppToken')

router.use('/newUser', newUser)
router.use('/newDev', newDev)
router.use('/newAppToken', newAppToken)

module.exports = router;