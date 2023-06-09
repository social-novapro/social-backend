const router = require('express').Router();
const getAPI = require('./get');
const postAPI = require('./post');
const authAPI = require('./auth');
const deleteAPI = require('./delete');
const putAPI = require('./put');
const adminAPI = require('./admin');
const polls = require('./polls');
const emails = require('./emails');

router.use('/get', getAPI);
router.use('/post', postAPI);
router.use('/auth', authAPI);
router.use('/delete', deleteAPI);
router.use('/put', putAPI);
router.use('/admin', adminAPI);  
router.use('/polls', polls);
router.use('/emails', emails);

module.exports = router;
