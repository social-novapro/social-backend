const router = require('express').Router();
// subscriptions
const subscriptions = require('./subscriptions');
const isSubbed = require('./isSubbed');
const sub  = require('./sub');
const unsub = require('./unsub');
const unsubAll = require('./unsubAll');

// notification
const dismiss = require('./dismiss');
const getList = require('./getList');

// subscriptions
router.use('/subscriptions', subscriptions);
router.use('/isSubbed', isSubbed);
router.use('/sub', sub);
router.use('/unsub', unsub);
router.use('/unsubAll', unsubAll);

// notification
router.use('/dismiss', dismiss);
router.use('/getList', getList);

module.exports = router;
