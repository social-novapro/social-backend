const router = require('express').Router();
// subscriptions
const subscriptions = require('./subscriptions');
const isSubbed = require('./isSubbed');
const sub  = require('./sub');
const unsub = require('./unsub');
const unsubAll = require('./unsubAll');

// notification
const push = require('./push');

// subscriptions
router.use('/subscriptions', subscriptions);
router.use('/isSubbed', isSubbed);
router.use('/sub', sub);
router.use('/unsub', unsub);
router.use('/unsubAll', unsubAll);

// notification
router.use('/push', push);

module.exports = router;
