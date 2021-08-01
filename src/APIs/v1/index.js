const router = require('express').Router()
const getAPI = require('./get')
const postAPI = require('./post')
const authAPI = require('./auth')
const deleteAPI = require('./delete')

router.use('/get', getAPI);
router.use('/post', postAPI)
router.use('/auth', authAPI)
router.use('/delete', deleteAPI)

module.exports = router;
