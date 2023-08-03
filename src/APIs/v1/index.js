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
const notifications = require('./notifications');
const feeds = require('./feeds');

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
router.use('/subscriptions', notifications);
router.use('/notifications', notifications);
router.use('/feeds', feeds);

module.exports = router;
