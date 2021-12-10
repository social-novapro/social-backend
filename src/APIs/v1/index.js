const router = require('express').Router()
const getAPI = require('./get')
const postAPI = require('./post')
const authAPI = require('./auth')
const deleteAPI = require('./delete')
const putAPI = require('./put')

router.use('/get', getAPI);
router.use('/post', postAPI)
router.use('/auth', authAPI)
router.use('/delete', deleteAPI)
router.use('/put', putAPI)

module.exports = router;
