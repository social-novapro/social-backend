const router = require('express').Router();
const preferences = require('./preferences');
const notifications = require('./notifications')
const subscriptions = require('./subscriptions');

router.use('/preferences', preferences);
router.use('/notifications',notifications);
router.use('/subscriptions', subscriptions);

module.exports = router;
