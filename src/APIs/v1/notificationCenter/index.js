const router = require('express').Router();
const getSettings = require('./getSettings');
const setSettings = require('./setSettings');

router.use('/getSettings', getSettings);
router.use('/setSettings', setSettings);

module.exports = router;
