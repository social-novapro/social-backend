const router = require('express').Router();
const getAPI = require('./get');
const putAPI = require('./put');
const errors = require('./errors');
const updateActions = require('./updateActions');

router.use('/errors', errors);
router.use('/get', getAPI);
router.use('/put', putAPI);
router.use('/updateActions', updateActions);

module.exports = router;
