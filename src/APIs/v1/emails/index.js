const router = require('express').Router();
const requests = require('./requests');
const set = require('./set');
const userData = require('./userData');
const removeData = require('./remove');
const settings = require('./settings');

router.use('/requests', requests);
router.use('/set', set);
router.use('/remove', removeData)
router.use('/userData', userData);
router.use('/settings', settings);

module.exports = router;
