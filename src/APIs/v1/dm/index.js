const router = require('express').Router();
const fetch = require('./fetch');
const send = require('./send');
const launch = require('./launch');

router.use('/fetch', fetch);
router.use('/send', send);
router.use('/launch', launch);

module.exports = router;
