const router = require('express').Router();
const push = require('./push');

router.use('/push', push);

module.exports = router;
