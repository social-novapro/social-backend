const router = require('express').Router();
const getAPI = require('./get');
const putAPI = require('./put');
const errors = require('./errors');

router.use('/errors', errors);
router.use('/get', getAPI);
router.use('/put', putAPI);

module.exports = router;
