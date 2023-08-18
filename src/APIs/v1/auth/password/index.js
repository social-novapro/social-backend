const router = require('express').Router();

const change = require('./change');
const forgot = require('./forgot');

router.use('/change', change);
router.use('/forgot', forgot);



module.exports = router;
