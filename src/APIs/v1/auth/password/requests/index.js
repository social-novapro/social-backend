const router = require('express').Router();

const confirmChange = require('./confirmChange');
const confirmForgot = require('./confirmForgot');

router.use('/confirmChange', confirmChange);
router.use('/confirmForgot', confirmForgot);

module.exports = router;
