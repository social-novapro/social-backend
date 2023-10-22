const router = require('express').Router();
const pins = require('./pins');

router.use('/pins', pins);

module.exports = router;
