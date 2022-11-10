const router = require('express').Router();
const getAPI = require('./get');
const putAPI = require('./put');

router.use('/get', getAPI);
router.use('/put', putAPI);

module.exports = router;
