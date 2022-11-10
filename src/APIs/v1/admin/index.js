const router = require('express').Router();
const getAPI = require('./get');

router.use('/get', getAPI);

module.exports = router;
