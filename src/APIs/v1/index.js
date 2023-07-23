const router = require('express').Router();
const getAPI = require('./get');
const postAPI = require('./post');
const deleteAPI = require('./delete');
const putAPI = require('./put');
const authAPI = require('./auth');
const adminAPI = require('./admin');
const polls = require('./polls');
const emails = require('./emails');
const users = require('./users');
const subscriptions = require('./subscriptions');

// Legacy Routes (still used)
router.use('/get', getAPI);
router.use('/post', postAPI);
router.use('/delete', deleteAPI);
router.use('/put', putAPI);

// Feature Routes
router.use('/auth', authAPI);
router.use('/admin', adminAPI);  
router.use('/polls', polls);
router.use('/emails', emails);
router.use('/users', users);
router.use('/subscriptions', subscriptions);

module.exports = router;
