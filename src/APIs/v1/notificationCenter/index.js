const router = require('express').Router();
const preferences = require('./preferences');

router.use('/preferences', preferences);

module.exports = router;
