const router = require('express').Router();
const preferences = require('./preferences');
const notifications = require('./notifications')

router.use('/preferences', preferences);
router.use('/notifications',notifications);

module.exports = router;
