const router = require('express').Router();
const getAll = require('./getAll');
const isSubbed = require('./isSubbed');
const sub  = require('./sub');
const unsub = require('./unsub');
const unsubAll = require('./unsubAll');

router.use('/getAll', getAll);
router.use('/isSubbed', isSubbed);
router.use('/sub', sub);
router.use('/unsub', unsub);
router.use('/unsubAll', unsubAll);

module.exports = router;
